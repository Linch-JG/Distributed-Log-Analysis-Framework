import random
import time
import pika
import os
import logging
import threading
import datetime
from faker import Faker
from prometheus_client import start_http_server, Counter, Gauge

logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASSWORD = os.getenv('RABBITMQ_PASSWORD', 'guest')
RABBITMQ_QUEUE = os.getenv('RABBITMQ_QUEUE', 'logs')
LOG_INTERVAL = float(os.getenv('LOG_INTERVAL', 0.001))
BATCH_SIZE = int(os.getenv('BATCH_SIZE', 50))
NUM_WORKERS = int(os.getenv('NUM_THREADS', 4))
SERVER_PORT = int(os.getenv('SERVER_PORT', 8000))
SERVER_ID = os.getenv('SERVER_ID', 'unknown')

LOGS_GENERATED = Counter('logs_generated_total', 'Total number of logs generated')
LOGS_SENT = Counter('logs_sent_total', 'Total number of logs sent to RabbitMQ')
ERRORS_TOTAL = Counter('connection_errors_total', 'Total number of connection errors')
ACTIVE_WORKERS = Gauge('active_workers', 'Number of active workers')

fake = Faker()
CACHED_IPS = [fake.ipv4() for _ in range(100)]
HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE']
ENDPOINTS = ['/api/users', '/api/products', '/api/orders', '/home', '/admin']
HTTP_STATUSES = [200, 200, 200, 200, 201, 400, 404, 500]
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
]

counter_lock = threading.Lock()
logs_generated = 0

def generate_log_entry():
    ip = random.choice(CACHED_IPS)
    method = random.choice(HTTP_METHODS)
    endpoint = random.choice(ENDPOINTS)
    status = random.choice(HTTP_STATUSES)
    bytes_sent = random.randint(200, 5000)
    user_agent = random.choice(USER_AGENTS)
    
    timestamp = datetime.datetime.now().strftime("%d/%b/%Y:%H:%M:%S +0000")
    
    log_entry = f'{SERVER_ID}: {ip} - - [{timestamp}] "{method} {endpoint} HTTP/1.1" {status} {bytes_sent} "-" "{user_agent}"'
    return log_entry

def generate_log_batch(size):
    return [generate_log_entry() for _ in range(size)]

def send_logs_worker(worker_id):
    global logs_generated
    
    ACTIVE_WORKERS.inc()
    
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    connection_params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
        heartbeat=60,
        blocked_connection_timeout=300,
        socket_timeout=15.0
    )
    
    while True:
        connection = None
        try:
            connection = pika.BlockingConnection(connection_params)
            channel = connection.channel()
            
            channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
            channel.basic_qos(prefetch_count=BATCH_SIZE)
            
            properties = pika.BasicProperties(
                delivery_mode=1,
            )
            
            while True:
                logs = generate_log_batch(BATCH_SIZE)
                
                for log in logs:
                    channel.basic_publish(
                        exchange='',
                        routing_key=RABBITMQ_QUEUE,
                        body=log,
                        properties=properties
                    )
                    LOGS_SENT.inc()
                
                time.sleep(LOG_INTERVAL)
                
                with counter_lock:
                    logs_generated += len(logs)
                    LOGS_GENERATED.inc(len(logs))
                    if logs_generated % 10000 == 0:
                        logger.warning(f"Worker {worker_id}: Generated and sent {logs_generated} logs")
                
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.AMQPChannelError) as e:
            logger.error(f"Worker {worker_id}: Connection error: {e}")
            ERRORS_TOTAL.inc()
            if connection and not connection.is_closed:
                try:
                    connection.close()
                except:
                    pass
            time.sleep(2)
        
        except Exception as e:
            logger.exception(f"Worker {worker_id}: Unexpected error: {e}")
            ERRORS_TOTAL.inc()
            if connection and not connection.is_closed:
                try:
                    connection.close()
                except:
                    pass
            time.sleep(5)
        finally:
            ACTIVE_WORKERS.dec()

def main():
    start_http_server(SERVER_PORT)
    logger.warning(f"Started Prometheus metrics server on port {SERVER_PORT}")
    
    logger.warning(f"Starting log generator with {NUM_WORKERS} workers")
    logger.warning(f"Configuration: BATCH_SIZE={BATCH_SIZE}, LOG_INTERVAL={LOG_INTERVAL}")
    
    threads = []
    for i in range(NUM_WORKERS):
        thread = threading.Thread(target=send_logs_worker, args=(i,), daemon=True)
        thread.start()
        threads.append(thread)
        logger.warning(f"Started worker {i}")
    
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        logger.warning("Received keyboard interrupt. Shutting down...")

if __name__ == "__main__":
    main()