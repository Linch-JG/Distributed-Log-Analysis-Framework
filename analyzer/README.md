# Analyzer Component - Distributed Log Analysis Framework

MapReduce is an efficient framework for processing large volumes of log data. In the map phase, log files are split and processed in parallel to extract key metrics. During the reduce phase, these results are aggregated. Then this information can be used to generate summaries, detect anomalies, and analyze user behavior.

The Analyzer component is implemented in Go. It executes a full MapReduce pipeline for logs. Initially, raw log records were consumed from RabbitMQ, then parsed via regular expressions into structured Log objects (Parsing). During the Map phase, client IP addresses and requested endpoints were extracted from each Log. Then mapped data with same IP/endpoint were grouped and reduced. The result data were stored in MongoDB.

## Features

- Real-time log processing via RabbitMQ message queue
- Flexible aggregation by IP addresses and endpoints
- Scalable architecture with batched processing
- MongoDB integration for persistent storage

## Architecture

The Analyzer implements a MapReduce pattern with the following components:

1. **Parser**: Converts raw log strings into structured log objects
2. **Mapper**: Transforms log entries into key-value pairs for aggregation
3. **Grouper**: Groups mapped outputs by keys
4. **Reducer**: Aggregates grouped outputs into final results