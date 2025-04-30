import os
import time
import logging
import json
from pymongo import MongoClient
import requests
from datetime import datetime
import pika
from prometheus_client import start_http_server, Gauge, Counter

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
CONSISTENCY_THRESHOLD_LOW = float(os.getenv('CONSISTENCY_THRESHOLD_LOW', 80))
CONSISTENCY_THRESHOLD_HIGH = float(os.getenv('CONSISTENCY_THRESHOLD_HIGH', 120))
PROCESSING_DELAY_ALLOWANCE = int(os.getenv('PROCESSING_DELAY_ALLOWANCE', 120))
METRICS_PORT = int(os.getenv('METRICS_PORT', 8080))
GENERATED_LOGS = Gauge('logs_generated_total', 'Total number of generated logs', ['server'])
GENERATED_LOGS_TOTAL = Gauge('logs_generated_total_combined', 'Total combined logs generated from all servers')
PROCESSED_LOGS = Gauge('logs_processed_total', 'Total number of processed logs')
QUEUE_DEPTH = Gauge('rabbitmq_queue_depth', 'Current RabbitMQ queue depth')
CONSISTENCY_RATIO = Gauge('consistency_ratio', 'Ratio between processed and generated logs (percentage)')
PROCESSING_TIME = Gauge('estimated_processing_time_seconds', 'Estimated time to process current queue in seconds')
CONSISTENCY_CHECKS = Counter('consistency_checks_total', 'Total number of consistency checks performed')
CONSISTENCY_ERRORS = Counter('consistency_errors_total', 'Total number of consistency errors detected')

class ConsistencyValidator:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.collection = None
        self.connect_to_mongodb()
        self.metrics_history = []
        self.historical_consistency = []
        logger.info(f"Consistency validator initialized with server URLs: {PYTHON_SERVER_METRICS_URLS}")

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
            
            if ip_count != endpoint_count and (ip_count > 0 and endpoint_count > 0):
                logger.warning(f"Internal inconsistency detected: IP count ({ip_count}) != Endpoint count ({endpoint_count})")
                return (ip_count + endpoint_count) // 2
            
            return ip_count if ip_count > 0 else endpoint_count
        except Exception as e:
            logger.error(f"Error getting logs count from MongoDB: {e}")
            return 0

    def get_generated_logs_counts(self):
        """Get generated logs counts from all test servers"""
        total_count = 0
        server_counts = {}

        for server_url in PYTHON_SERVER_METRICS_URLS:
            try:
                response = requests.get(server_url, timeout=5)
                if response.status_code == 200:
                    metrics_text = response.text
                    server_count = 0
                    for line in metrics_text.split('\n'):
                        if line.startswith('logs_generated_total'):
                            value = line.split(' ')[-1]
                            server_count = int(float(value))
                            break
                    
                    server_name = server_url.split('//')[1].split(':')[0]
                    server_counts[server_name] = server_count
                    total_count += server_count
                    GENERATED_LOGS.labels(server=server_name).set(server_count)
                    logger.info(f"Server {server_name}: {server_count} logs generated")
                else:
                    logger.warning(f"Failed to get metrics from {server_url}, status code: {response.status_code}")
            except Exception as e:
                logger.error(f"Error getting generated logs count from {server_url}: {e}")
        
        GENERATED_LOGS_TOTAL.set(total_count)
        logger.info(f"Total logs generated across all servers: {total_count}")
        
        return total_count, server_counts
    
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

    def check_consistency(self):
        processed_count = self.get_logs_count_from_mongodb()
        generated_count, server_counts = self.get_generated_logs_counts()
        queue_depth = self.get_queue_depth()
        
        PROCESSED_LOGS.set(processed_count)
        if queue_depth is not None:
            QUEUE_DEPTH.set(queue_depth)
        
        CONSISTENCY_CHECKS.inc()
        
        if generated_count == 0:
            logger.warning("Cannot check consistency: no logs generated yet")
            return
        
        adjusted_generated_count = generated_count
        if queue_depth is not None:
            logger.info(f"Current queue depth: {queue_depth} messages")
            adjusted_generated_count = generated_count - queue_depth
        
        logger.info(f"Generated logs: {generated_count} (from {len(server_counts)} servers), Adjusted for queue: {adjusted_generated_count}, Processed logs: {processed_count}")
        
        if adjusted_generated_count > 0:
            consistency_percentage = (processed_count / adjusted_generated_count) * 100
            CONSISTENCY_RATIO.set(consistency_percentage)
            
            self.historical_consistency.append({
                "timestamp": datetime.now().isoformat(),
                "generated": generated_count,
                "adjusted_generated": adjusted_generated_count,
                "processed": processed_count,
                "queue_depth": queue_depth,
                "consistency_percentage": consistency_percentage,
                "server_counts": server_counts
            })
            
            if len(self.historical_consistency) > 10:
                self.historical_consistency.pop(0)
            
            logger.info(f"Processing percentage (with queue adjustment): {consistency_percentage:.2f}%")
            
            trend = self.analyze_trend()
            
            if consistency_percentage < CONSISTENCY_THRESHOLD_LOW:
                if trend == "improving":
                    logger.warning(f"Consistency below threshold ({consistency_percentage:.2f}%), but improving")
                else:
                    logger.warning(f"ALERT: Low consistency ({consistency_percentage:.2f}%), potential data loss")
                    CONSISTENCY_ERRORS.inc()
            elif consistency_percentage > CONSISTENCY_THRESHOLD_HIGH:
                logger.warning(f"ALERT: High consistency ({consistency_percentage:.2f}%), potential duplicate processing")
                CONSISTENCY_ERRORS.inc()
            else:
                logger.info(f"Consistency within acceptable range: {consistency_percentage:.2f}%")
        else:
            logger.warning("No logs have been generated yet or all logs are still in queue")
    
    def analyze_trend(self):
        if len(self.historical_consistency) < 2:
            return "insufficient_data"
        
        recent = self.historical_consistency[-min(3, len(self.historical_consistency)):]
        
        if all(recent[i]["consistency_percentage"] < recent[i+1]["consistency_percentage"] for i in range(len(recent)-1)):
            return "improving"
        elif all(recent[i]["consistency_percentage"] > recent[i+1]["consistency_percentage"] for i in range(len(recent)-1)):
            return "degrading"
        else:
            return "stable"
    
    def export_consistency_metrics(self):
        processed_count = self.get_logs_count_from_mongodb()
        generated_count, server_counts = self.get_generated_logs_counts()
        queue_depth = self.get_queue_depth() or 0
        
        if len(self.historical_consistency) >= 2:
            processing_speed = (self.historical_consistency[-1]["processed"] - self.historical_consistency[0]["processed"]) / len(self.historical_consistency)
            estimated_processing_time = queue_depth / processing_speed if processing_speed > 0 else None
            if estimated_processing_time is not None:
                PROCESSING_TIME.set(estimated_processing_time)
        else:
            estimated_processing_time = None
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "processed_logs_total": processed_count,
            "generated_logs_total": generated_count,
            "server_counts": server_counts,
            "queue_depth": queue_depth,
            "consistency_ratio": processed_count / (generated_count - queue_depth) if (generated_count - queue_depth) > 0 else 0,
            "consistency_percentage": (processed_count / (generated_count - queue_depth) * 100) if (generated_count - queue_depth) > 0 else 0,
            "estimated_queue_processing_time_seconds": estimated_processing_time,
            "trend": self.analyze_trend(),
            "historical_data": self.historical_consistency[-5:] if len(self.historical_consistency) > 0 else []
        }
        
        try:
            with open('/metrics/consistency_metrics.json', 'w') as f:
                json.dump(metrics, f, indent=2)
            logger.debug("Metrics exported to /metrics/consistency_metrics.json")
        except Exception as e:
            logger.error(f"Error exporting metrics: {e}")

    def run(self):
        logger.info("Starting consistency validator")
        logger.info(f"Monitoring {len(PYTHON_SERVER_METRICS_URLS)} test servers")
        logger.info(f"Consistency thresholds: Low={CONSISTENCY_THRESHOLD_LOW}%, High={CONSISTENCY_THRESHOLD_HIGH}%")
        logger.info(f"Processing delay allowance: {PROCESSING_DELAY_ALLOWANCE} seconds")
        
        start_http_server(METRICS_PORT)
        logger.info(f"Started Prometheus metrics HTTP server on port {METRICS_PORT}")
        
        initial_pause = 30
        logger.info(f"Waiting {initial_pause} seconds for system to stabilize...")
        time.sleep(initial_pause)
        
        while True:
            try:
                self.check_consistency()
                self.export_consistency_metrics()
            except Exception as e:
                logger.exception(f"Error during consistency check: {e}")
            
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    time.sleep(10)
    validator = ConsistencyValidator()
    validator.run()