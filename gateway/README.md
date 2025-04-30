# Log Analysis API Gateway

The API Gateway serves as the central entry point for the Distributed Log Analysis Framework, providing RESTful endpoints for log management and analytics.

## Overview

This Spring Boot application acts as an interface between clients and the log analysis backend, providing:

- Log data management (CRUD operations)
- Aggregation and analytics endpoints
- Swagger documentation

## Architecture

The API Gateway is part of a larger distributed system:

```
Client Applications → API Gateway → MongoDB
                                 ↘ RabbitMQ → Log Analyzer
```

- **API Gateway**: Spring Boot REST service (this component)
- **MongoDB**: Storage for log data and analysis results
- **RabbitMQ**: Message broker for distributed processing
- **Log Analyzer**: Go-based MapReduce analytics engine

## API Endpoints

### Log Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Get all logs (with optional filtering) |
| GET | `/api/logs/{id}` | Get a specific log by ID |
| POST | `/api/logs` | Create a new log entry |
| PUT | `/api/logs/{id}` | Update an existing log entry |
| DELETE | `/api/logs/{id}` | Delete a log entry |

### Query Parameters for GET /api/logs

- `serverId` - Filter logs by server ID
- `type` - Filter logs by type (e.g., "ip", "endpoint")
- `from` - Start timestamp (in milliseconds)
- `to` - End timestamp (in milliseconds)

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/ips` | Get most active IP addresses |
| GET | `/api/analytics/endpoints` | Get most accessed endpoints |
| GET | `/api/analytics/grouped` | Get analytics grouped by server |

## Setup & Installation

### Prerequisites

- Java 11 or higher
- Maven 3.6+
- MongoDB instance
- RabbitMQ instance

### Building the Application

```bash
cd gateway
./mvnw clean package
```

### Running the Application

```bash
java -jar target/log-analysis-gateway-0.0.1-SNAPSHOT.jar
```

### Docker Deployment

The API Gateway can be deployed using Docker:

```bash
# From the project root
docker build -f docker/Dockerfile.gateway -t log-analysis-gateway .
docker run -p 8080:8080 log-analysis-gateway
```

Or use docker-compose for the entire system:

```bash
cd docker
docker-compose up -d
```

## Configuration

The application is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| SPRING_DATA_MONGODB_HOST | MongoDB hostname | - |
| SPRING_DATA_MONGODB_PORT | MongoDB port | - |
| SPRING_DATA_MONGODB_DATABASE | MongoDB database name | - |
| SPRING_DATA_MONGODB_USERNAME | MongoDB username | - |
| SPRING_DATA_MONGODB_PASSWORD | MongoDB password | - |
| SPRING_DATA_MONGODB_AUTHENTICATION_DATABASE | MongoDB auth database | admin |
| SERVER_PORT | API Gateway port | 8080 |

## API Documentation

API documentation is available through Swagger UI at:

```
http://[host]:[port]/swagger-ui.html
```

## Development

### Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/log/Linch_JG/log/analysis/
│   │       ├── config/         # Application configuration
│   │       ├── controller/     # REST controllers
│   │       ├── model/          # Data models
│   │       ├── repository/     # Database access
│   │       ├── service/        # Business logic
│   │       └── DistributedLogAnlysisApplication.java
│   └── resources/
│       └── application.properties
└── test/
    └── java/
        └── com/log/Linch_JG/log/analysis/
            └── DistributedLogAnlysisApplicationTests.java
```

### Adding New Endpoints

1. Create a new controller or extend existing ones in the `controller` package
2. Define service interfaces in the `service` package
3. Implement services in the `service/impl` package
4. Add model classes as needed in the `model` package