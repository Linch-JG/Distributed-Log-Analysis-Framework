# Distributed-Log-Analysis-Framework
Modern distributed systems generate large amounts of log data from various sources, making
effective analysis essential for monitoring, security, and optimization. This project introduces a
custom distributed log analysis framework based on the MapReduce paradigm, allowing scalable
log processing and aggregation across multiple nodes. Our system extracts key data such as the
most active IP addresses and endpoints using a microservices architecture, consisting of a Java
Spring Boot API gateway, Go-based analyzer, MongoDB, and a reliable messaging pipeline using
RabbitMQ. The framework has been tested using generated logs that are similar to those found in
the real world, and it provides an interactive dashboard. The dashboard focuses on extracting the
most active IP addresses or endpoints from server logs. This allows organizations to gain valuable
insights from their distributed system's data.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/Distributed-Log-Analysis-Framework.git
cd Distributed-Log-Analysis-Framework
```

### Step 2: Start the Services
Navigate to the docker directory and start all services:
```bash
cd docker
docker-compose up -d --build
```

### Step 3: Verify Services
Check that all containers are running:
```bash
docker ps
```

### Step 4: Access Web Interfaces
### Frontend Web UI
- URL: http://localhost:4173

### Gateway API
- URL: http://localhost:8080

### Mongo-Express (MongoDB Web UI)
- URL: http://localhost:8081
- Login: admin
- Password: admin

### MongoDB
- Port: 27018
- Login: admin
- Password: admin

### RabbitMQ Management UI
- URL: http://localhost:15672
- Login: admin
- Password: admin

### Test Servers
- Server 1: http://localhost:8001
- Server 2: http://localhost:8002
- Server 3: http://localhost:8003
- Metrics endpoint: /metrics

### Consistency Validator
- URL: http://localhost:8090
- Metrics endpoint: /metrics

### Performance Analyzer
- URL: http://localhost:8091
- Metrics endpoint: /metrics

### Prometheus (Monitoring)
- URL: http://localhost:9090

### Grafana (Dashboards)
- URL: http://localhost:3000
- Login: admin
- Password: admin



### Step 5: Stopping the Services
When you're done, you can stop all services with:
```bash
docker compose down -v
```

For more detailed information about specific components, refer to the documentation section below.

## Documentation
- [Docker setup and configuration](docker/README.md)
- [Gateway API documentation](gateway/README.md)
- [Test Servers documentation](test-servers/README.md)
- [Analyzer documentation](analyzer/README.md)
- [Frontend documentation](frontend/README.md)
### [Figma board link](https://www.figma.com/board/4VOwMDVzaCjXlxx79GB2qE/Untitled?t=h3ijaX7ESqqBWqBm-1)
## Access to services

