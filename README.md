# Distributed Log Analysis Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker Compose](https://img.shields.io/badge/Orchestration-Docker%20Compose-2496ED?logo=docker&logoColor=white)](docker/docker-compose.yml)
[![CI](https://github.com/Linch-JG/Distributed-Log-Analysis-Framework/actions/workflows/check-docker-files.yml/badge.svg)](https://github.com/Linch-JG/Distributed-Log-Analysis-Framework/actions/workflows/check-docker-files.yml)

A MapReduce-style distributed log analysis stack for aggregating web-style server logs across nodes. Services ingest logs through a message pipeline, persist results in MongoDB, and expose a **Spring Boot** gateway API plus a **React (Vite)** dashboard for metrics such as busiest IPs and endpoints. Optional **Prometheus** and **Grafana** wiring supports operational visibility.

## Architecture (high level)

| Layer | Technology |
| ----- | ------------ |
| API gateway | Java Spring Boot |
| Worker / analyzer | Go |
| Messaging | RabbitMQ |
| Storage | MongoDB |
| UI | React, TypeScript, Vite |
| Observability | Prometheus, Grafana (see compose) |

Component-specific notes live under each package’s README (linked below).

## Prerequisites

- **Docker** and **Docker Compose** (v2 plugin recommended)
- **Git**

Local builds of individual services may additionally require **JDK**, **Go**, and **Node.js**; the primary path is Compose.

## Quick start

Clone and start the full stack from the `docker` directory:

```bash
git clone https://github.com/Linch-JG/Distributed-Log-Analysis-Framework.git
cd Distributed-Log-Analysis-Framework/docker
docker compose up -d --build
```

Verify containers:

```bash
docker ps
```

Shut down and remove volumes:

```bash
docker compose down -v
```

## Default endpoints (local)

| Service | URL / port |
| ------- | ---------- |
| Dashboard (frontend) | http://localhost:4173 |
| Gateway API | http://localhost:8080 |
| Mongo Express | http://localhost:8081 (`admin` / `admin`) |
| MongoDB | `localhost:27018` (`admin` / `admin`) |
| RabbitMQ management | http://localhost:15672 (`admin` / `admin`) |
| Test servers | http://localhost:8001–8003 (`/metrics` where applicable) |
| Consistency validator | http://localhost:8090 |
| Performance analyzer | http://localhost:8091 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (`admin` / `admin`) |

Credentials shown are the defaults from Compose; override via environment variables where supported (see [docker/README.md](docker/README.md)).

## Documentation

- [Docker setup](docker/README.md)
- [Gateway](gateway/README.md)
- [Analyzer](analyzer/README.md)
- [Frontend](frontend/README.md)
- [Test servers](test-servers/README.md)

Design reference: [FigJam board](https://www.figma.com/board/4VOwMDVzaCjXlxx79GB2qE/Untitled?t=h3ijaX7ESqqBWqBm-1)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
