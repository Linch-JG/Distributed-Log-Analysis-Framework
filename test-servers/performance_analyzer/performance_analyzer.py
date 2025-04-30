import os
import time
import logging
import json
from pymongo import MongoClient
import requests
from datetime import datetime
import pika
from prometheus_client import start_http_server, Gauge, Counter, Histogram

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DATABASE = os.getenv('MONGO_DATABASE', 'logs_db')
MONGO_COLLECTION = os.getenv('MONGO_COLLECTION', 'logs')
CHECK_INTERVAL = int(os.getenv('CHECK_INTERVAL', 30))
PYTHON_SERVER_METRICS_URLS = os.getenv('PYTHON_SERVER_METRICS_URL', 'http://python-server:8000/metrics').split(',')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'guest')
RABBITMQ_QUEUE = os.getenv('RABBITMQ_QUEUE', 'logs')
METRICS_PORT = int(os.getenv('METRICS_PORT', 8091))
PERFORMANCE_THRESHOLD_WARNING = float(os.getenv('PERFORMANCE_THRESHOLD_WARNING', 500))
PERFORMANCE_THRESHOLD_CRITICAL = float(os.getenv('PERFORMANCE_THRESHOLD_CRITICAL', 1000))
PROCESSING_TIME_GAUGE = Gauge('log_processing_time_ms', 'Average log processing time in milliseconds', ['component'])
PROCESSING_RATE = Gauge('log_processing_rate', 'Number of logs processed per second', ['component'])
LOGS_TOTAL = Gauge('logs_processed_total_by_component', 'Total number of logs processed', ['component'])
QUEUE_SIZE = Gauge('rabbitmq_queue_size', 'Current size of the RabbitMQ queue')
QUEUE_RATE = Gauge('rabbitmq_queue_rate', 'Rate of change of the RabbitMQ queue size (logs/second)')
LATENCY_HISTOGRAM = Histogram('log_processing_latency_ms', 'Histogram of log processing latency in milliseconds',
                             ['component'], buckets=(50, 100, 200, 500, 1000, 2000, 5000))
PERFORMANCE_CHECKS = Counter('performance_checks_total', 'Total number of performance checks performed')
PERFORMANCE_WARNINGS = Counter('performance_warnings_total', 'Total number of performance warnings detected')
PERFORMANCE_ERRORS = Counter('performance_errors_total', 'Total number of performance errors detected')

class PerformanceAnalyzer:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.collection = None
        self.connect_to_mongodb()
        self.performance_history = []
        self.last_processed_count = None
        self.last_check_time = None
        self.last_queue_depth = None
        self.server_metrics = {}
        logger.info(f"Performance analyzer initialized with server URLs: {PYTHON_SERVER_METRICS_URLS}")

    def connect_to_mongodb(self):
        try:
            self.mongo_client = MongoClient(MONGO_URI)
            self.db = self.mongo_client[MONGO_DATABASE]
            self.collection = self.db[MONGO_COLLECTION]
            logger.info(f"Connected to MongoDB at {MONGO_URI}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def get_logs_count_from_mongodb(self):
        try:
            ip_aggregation = list(self.collection.find({"type": "ip"}))
            endpoint_aggregation = list(self.collection.find({"type": "endpoint"}))
            
            ip_count = sum(doc["count"] for doc in ip_aggregation) if ip_aggregation else 0
            endpoint_count = sum(doc["count"] for doc in endpoint_aggregation) if endpoint_aggregation else 0
            
            if ip_count != endpoint_count and ip_count > 0 and endpoint_count > 0:
                logger.warning(f"Internal inconsistency detected: IP count ({ip_count}) != Endpoint count ({endpoint_count})")
                return (ip_count + endpoint_count) // 2
            
            return ip_count if ip_count > 0 else endpoint_count
        except Exception as e:
            logger.error(f"Error getting logs count from MongoDB: {e}")
            return 0

    def get_server_metrics(self):
        server_metrics = {}

        for server_url in PYTHON_SERVER_METRICS_URLS:
            try:
                response = requests.get(server_url, timeout=5)
                if response.status_code == 200:
                    metrics_text = response.text
                    metrics = {}
                    for line in metrics_text.split('\n'):
                        if not line.startswith('#') and ' ' in line:
                            key, value = line.split(' ', 1)
                            try:
                                metrics[key] = float(value)
                            except ValueError:
                                continue
                    
                    server_name = server_url.split('//')[1].split(':')[0]
                    server_metrics[server_name] = metrics
                    logger.info(f"Collected metrics from {server_name}")
                else:
                    logger.warning(f"Failed to get metrics from {server_url}, status code: {response.status_code}")
            except Exception as e:
                logger.error(f"Error getting metrics from {server_url}: {e}")
        
        return server_metrics
    
    def get_queue_depth(self):
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
            connection_params = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials,
                heartbeat=60,
                socket_timeout=5
            )
            connection = pika.BlockingConnection(connection_params)
            channel = connection.channel()
            
            queue_info = channel.queue_declare(queue=RABBITMQ_QUEUE, passive=True)
            message_count = queue_info.method.message_count
            
            connection.close()
            return message_count
        except Exception as e:
            logger.error(f"Error getting queue depth: {e}")
            return None

    def analyze_performance(self):
        current_time = datetime.now()
        processed_count = self.get_logs_count_from_mongodb()
        queue_depth = self.get_queue_depth()
        server_metrics = self.get_server_metrics()
        
        PERFORMANCE_CHECKS.inc()
        
        if queue_depth is not None:
            QUEUE_SIZE.set(queue_depth)
        
        if self.last_processed_count is not None and self.last_check_time is not None:
            elapsed_seconds = (current_time - self.last_check_time).total_seconds()
            if elapsed_seconds > 0:
                logs_delta = processed_count - self.last_processed_count
                processing_rate = logs_delta / elapsed_seconds
                PROCESSING_RATE.labels(component="analyzer").set(processing_rate)
                logger.info(f"Processing rate: {processing_rate:.2f} logs/sec")
                
                if logs_delta > 0:
                    avg_processing_time_ms = (elapsed_seconds * 1000) / logs_delta
                    PROCESSING_TIME_GAUGE.labels(component="analyzer").set(avg_processing_time_ms)
                    LATENCY_HISTOGRAM.labels(component="analyzer").observe(avg_processing_time_ms)
                    logger.info(f"Average processing time: {avg_processing_time_ms:.2f} ms per log")
                    
                    if avg_processing_time_ms > PERFORMANCE_THRESHOLD_CRITICAL:
                        logger.error(f"CRITICAL: Processing time ({avg_processing_time_ms:.2f} ms) exceeds critical threshold ({PERFORMANCE_THRESHOLD_CRITICAL} ms)")
                        PERFORMANCE_ERRORS.inc()
                    elif avg_processing_time_ms > PERFORMANCE_THRESHOLD_WARNING:
                        logger.warning(f"WARNING: Processing time ({avg_processing_time_ms:.2f} ms) exceeds warning threshold ({PERFORMANCE_THRESHOLD_WARNING} ms)")
                        PERFORMANCE_WARNINGS.inc()
                
                if queue_depth is not None and self.last_queue_depth is not None:
                    queue_change_rate = (queue_depth - self.last_queue_depth) / elapsed_seconds
                    QUEUE_RATE.set(queue_change_rate)
                    if queue_change_rate > 0:
                        logger.warning(f"Queue growing at rate of {queue_change_rate:.2f} logs/second")
                    else:
                        logger.info(f"Queue shrinking at rate of {abs(queue_change_rate):.2f} logs/second")
        
        for server_name, metrics in server_metrics.items():
            for metric_key, metric_value in metrics.items():
                if metric_key == 'logs_generated_total':
                    LOGS_TOTAL.labels(component=f"server_{server_name}").set(metric_value)
                elif 'processing_time' in metric_key and '_count' not in metric_key and '_sum' not in metric_key:
                    PROCESSING_TIME_GAUGE.labels(component=f"server_{server_name}").set(metric_value)
                    LATENCY_HISTOGRAM.labels(component=f"server_{server_name}").observe(metric_value)
        
        self.last_processed_count = processed_count
        self.last_check_time = current_time
        self.last_queue_depth = queue_depth
        
        performance_point = {
            "timestamp": current_time.isoformat(),
            "processed_count": processed_count,
            "queue_depth": queue_depth,
            "server_metrics": server_metrics
        }
        
        self.performance_history.append(performance_point)
        if len(self.performance_history) > 60:
            self.performance_history.pop(0)
        
        return performance_point

    def analyze_trends(self):
        if len(self.performance_history) < 5:
            return {"status": "insufficient_data", "message": "Недостаточно данных для анализа трендов"}
        
        recent_points = self.performance_history[-5:]
        
        processing_trend = "stable"
        if all(recent_points[i]["processed_count"] < recent_points[i+1]["processed_count"] 
              for i in range(len(recent_points)-1)):
            processing_trend = "improving"
        elif all(recent_points[i]["processed_count"] > recent_points[i+1]["processed_count"] 
               for i in range(len(recent_points)-1)):
            processing_trend = "degrading"
        
        queue_trend = "stable"
        if all(recent_points[i].get("queue_depth", 0) > recent_points[i+1].get("queue_depth", 0) 
              for i in range(len(recent_points)-1)):
            queue_trend = "improving"
        elif all(recent_points[i].get("queue_depth", 0) < recent_points[i+1].get("queue_depth", 0) 
               for i in range(len(recent_points)-1)):
            queue_trend = "degrading"
        
        overall_status = "healthy"
        if queue_trend == "degrading" and processing_trend != "improving":
            overall_status = "at_risk"
            if any(p.get("queue_depth", 0) > 1000 for p in recent_points):
                overall_status = "critical"
        elif processing_trend == "degrading":
            overall_status = "at_risk"
        
        return {
            "status": overall_status,
            "processing_trend": processing_trend,
            "queue_trend": queue_trend,
            "analysis_time": datetime.now().isoformat()
        }

    def export_performance_metrics(self):
        performance_data = self.analyze_performance()
        trends_analysis = self.analyze_trends()
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "current": performance_data,
            "trends": trends_analysis,
            "historical_data": self.performance_history[-10:] if len(self.performance_history) > 0 else []
        }
        
        recommendations = []
        if trends_analysis["status"] == "critical":
            recommendations.append("Критическая ситуация: рассмотрите возможность масштабирования компонента analyzer")
            recommendations.append("Проверьте логи компонента analyzer на наличие ошибок или блокировок")
        elif trends_analysis["status"] == "at_risk":
            recommendations.append("Ситуация требует внимания: мониторьте рост очереди")
            if trends_analysis["queue_trend"] == "degrading":
                recommendations.append("Очередь растет - возможно, скорость обработки недостаточна для текущей нагрузки")
        
        metrics["recommendations"] = recommendations
        
        try:
            with open('/metrics/performance_metrics.json', 'w') as f:
                json.dump(metrics, f, indent=2)
            logger.debug("Performance metrics exported to /metrics/performance_metrics.json")
        except Exception as e:
            logger.error(f"Error exporting metrics: {e}")

    def run(self):
        logger.info("Starting performance analyzer")
        logger.info(f"Performance thresholds: Warning={PERFORMANCE_THRESHOLD_WARNING}ms, Critical={PERFORMANCE_THRESHOLD_CRITICAL}ms")
        
        start_http_server(METRICS_PORT)
        logger.info(f"Started Prometheus metrics HTTP server on port {METRICS_PORT}")
        
        initial_pause = 30
        logger.info(f"Waiting {initial_pause} seconds for system to stabilize...")
        time.sleep(initial_pause)
        
        while True:
            try:
                self.export_performance_metrics()
            except Exception as e:
                logger.exception(f"Error during performance analysis: {e}")
            
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    time.sleep(10)
    analyzer = PerformanceAnalyzer()
    analyzer.run()