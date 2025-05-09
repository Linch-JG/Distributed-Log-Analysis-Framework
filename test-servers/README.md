# Test Server Environment for Distributed Log Analysis Framework

This directory contains a complete test environment for the Distributed Log Analysis Framework. It's designed to generate logs, process them, validate consistency, and monitor system performance through metrics visualization.

## Architecture Overview

The test environment consists of several interconnected components:

![Architecture Diagram](https://www.mermaidchart.com/raw/950bf1f1-2eb2-46eb-89c1-577f91c8b0bd?theme=light&version=v0.1&format=svg)

## Components

### Python Server (`server/`)

A log generator service that simulates web server activity by creating and sending logs to RabbitMQ.

- **Key Features**:
  - Generates realistic HTTP server logs with random IPs, endpoints, HTTP methods, etc.
  - Uses multi-threading for high-volume log generation
  - Exports Prometheus metrics about generation rate
  - Configurable through environment variables

- **Environment Variables**:
  - `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD` - RabbitMQ connection settings
  - `RABBITMQ_QUEUE` - Queue name for logs
  - `LOG_INTERVAL` - Delay between log batches (seconds)
  - `BATCH_SIZE` - Number of logs in each batch
  - `NUM_THREADS` - Number of generator threads
  - `SERVER_PORT` - Port for metrics exposure

### RabbitMQ

Message queue that acts as a buffer between the log generator and the log processor.

- **Configuration**:
  - Default credentials (guest/guest)
  - Management UI available on port 15672
  - Durable queue configuration for reliability

### Consistency Validator (`consistency_validator/`)

A service that monitors the entire pipeline to ensure logs are processed correctly.

- **Key Features**:
  - Compares generated logs count with processed logs count
  - Accounts for logs in queue awaiting processing
  - Calculates and exports consistency metrics
  - Detects potential data loss or duplicate processing
  - Analyzes trends to determine if issues are improving or worsening
  - Exports detailed metrics to Prometheus

- **Environment Variables**:
  - `MONGO_URI`, `MONGO_DATABASE`, `MONGO_COLLECTION` - MongoDB connection settings
  - `CHECK_INTERVAL` - Time between consistency checks (seconds)
  - `PYTHON_SERVER_METRICS_URL` - URL to fetch generator metrics
  - `RABBITMQ_*` - RabbitMQ connection settings
  - `CONSISTENCY_THRESHOLD_LOW`, `CONSISTENCY_THRESHOLD_HIGH` - Thresholds for consistency alerts
  - `METRICS_PORT` - Port for Prometheus metrics

### Performance Analyzer (`performance_analyzer/`)

A service that analyzes and exports performance metrics for the log processing pipeline.

- **Key Features**:
  - Monitors log processing times across different components
  - Calculates processing rates and throughput
  - Identifies performance bottlenecks
  - Provides real-time performance metrics for the pipeline
  - Exports metrics to Prometheus for visualization in Grafana

- **Environment Variables**:
  - `PYTHON_SERVER_METRICS_URL` - URL to fetch generator metrics
  - `CHECK_INTERVAL` - Time between performance checks (seconds)
  - `METRICS_PORT` - Port for Prometheus metrics
  - `RABBITMQ_*` - RabbitMQ connection settings for queue monitoring

### Prometheus (`prometheus/`)

Time-series database for storing and querying metrics from all components.

- **Configuration**:
  - Scrapes metrics from Python Server, Consistency Validator, and Performance Analyzer
  - Default settings: 15s scrape interval, 15s evaluation interval
  - Configured via `prometheus.yml`

### Grafana (`grafana/`)

Visualization platform for metrics stored in Prometheus.

- **Dashboard Features**:
  - Real-time log generation vs. processing rates
  - Consistency ratio gauge (ideal: 95-105%)
  - RabbitMQ queue depth monitoring
  - Consistency trends over time
  - Performance metrics visualization
  - Multiple dashboards for different monitoring focuses

## Metrics Overview

The system exposes the following key metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `logs_generated_total` | Counter | Total number of logs generated by Python Server |
| `logs_sent_total` | Counter | Total number of logs sent to RabbitMQ |
| `logs_processed_total` | Gauge | Total number of logs processed and stored in MongoDB |
| `rabbitmq_queue_depth` | Gauge | Current number of messages in the RabbitMQ queue |
| `consistency_ratio` | Gauge | Ratio between processed and generated logs (percentage) |
| `consistency_checks_total` | Counter | Total number of consistency checks performed |
| `connection_errors_total` | Counter | Total connection errors during log generation/processing |
| `active_workers` | Gauge | Number of active worker threads in Python Server |
| `log_processing_time_ms` | Gauge | Processing time for logs in milliseconds |
| `log_processing_rate` | Gauge | Rate of log processing (logs/sec) |
| `logs_processed_total_by_component` | Gauge | Logs processed by each component |

## Grafana Dashboards

The system includes two specialized dashboards:

### 1. Log Monitoring Dashboard

This dashboard (`log-monitoring-dashboard.json`) focuses on data consistency and pipeline health:

1. **Logs (Generated vs Processed)**: Time-series graph showing the gap between logs generated and processed
2. **Data Consistency Ratio**: Gauge showing processing consistency percentage
3. **Log Counters**: Current totals for generated and processed logs
4. **RabbitMQ Queue Depth**: Current number of messages in queue
5. **RabbitMQ Queue Depth Trend**: Time-series graph of queue depth over time
6. **Consistency Ratio Trend**: Time-series graph showing consistency patterns

### 2. Performance Dashboard

This dashboard (`performance-dashboard.json`) focuses on system performance metrics:

1. **Log Processing Time (ms)**: Time-series graph showing processing times
2. **Processing Rate (logs/sec)**: Time-series graph of throughput
3. **Logs Processed Distribution**: Pie chart showing log distribution by component

The dashboards use color-coded thresholds:
- Green: System functioning normally (consistency 95-105%)
- Yellow: Warning range (consistency 80-95% or 105-120%)
- Red: Critical issues (consistency <80% or >120%)

### Detailed Dashboard Interpretation

#### Generated vs Processed Graph Convergence

The "Logs (Generated vs Processed)" graph is a critical visualization of our system's data flow integrity. The two lines typically follow similar trajectories but with important characteristics:

1. **Convergence Pattern**: In a healthy system, both lines should grow at similar rates, with the "Generated" line slightly leading the "Processed" line. This convergence pattern indicates that logs are being processed at a rate comparable to their generation, allowing for the expected processing delay.

2. **Gap Interpretation**: A small gap between the lines represents logs in transit (either in the RabbitMQ queue or being processed). This gap should remain relatively constant in a stable system. If the gap widens over time, it suggests that processing is falling behind generation.

#### Processed Graph Stepped Appearance

The "Processed" line typically shows a stepped pattern rather than a smooth curve due to the metric update frequency. The processed metrics are updated at specific intervals (15 seconds) determined by the batch completion, while generated metrics may update more frequently.

This stepped appearance is normal and expected behavior, which helps to observe metrics in multithreading environment.

#### Data Consistency Ratio Boundaries

The Data Consistency Ratio gauge uses specific thresholds that have been carefully calibrated to reflect the operational realities of the distributed system:

1. **Optimal Range (95-105%, Green)**:
   - A ratio between 95-105% indicates healthy system operation
   - The 5% tolerance accounts for normal processing delays and measurement timing differences
   - In this range, the system is considered fully reliable

2. **Warning Range (80-95% or 105-120%, Yellow)**:
   - Lower range (80-95%): Some logs may be delayed in processing or potentially lost
   - Upper range (105-120%): Possible duplicate processing or measurement anomalies
   - Investigation is recommended but not critical

3. **Critical Range (<80% or >120%, Red)**:
   - Below 80%: Significant log loss or severe processing delays
   - Above 120%: Serious duplication issues or fundamental measurement errors
   - Immediate investigation is necessary

#### Log Counters Interpretation

The "Logs (Generated vs Processed)" panel shows a stepped lines of "Generated" and "Processed" counts. This is done due to a 15 seconds interval between collecting metrics to deal with the message queue storing some part of the logs before they are consumed be the analyzer. 

## Running the Environment

Service endpoints:
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090 (http://prometheus:9090 for Grafana Datasource)
- RabbitMQ Management: http://localhost:15672
- MongoDB Express: http://localhost:8081

## Adding New Test Servers

To add a new test server instance (e.g., test-servers-4) to increase log generation load:

1. In `docker/docker-compose.yml`, duplicate an existing test-servers block, increment the container name to test-servers-4, and assign a new port (e.g., 8003:8000).
2. Update the `PYTHON_SERVER_METRICS_URL` environment variable in both consistency-validator and performance-analyzer services to include the new server's metrics endpoint (e.g., add `,http://test-servers-4:8000/metrics`).
3. Add the new server to the prometheus.yml targets: `- targets: ['test-servers-1:8000', 'test-servers-2:8000', 'test-servers-3:8000', 'test-servers-4:8000']`.
4. Update any service dependencies to include the new server.
5. Restart the environment using `docker-compose down -v && docker-compose up -d` from the docker directory.
