# Log Analysis Gateway

## Overview

This gateway, based on Spring Boot, introduce a RESTful API that simplifies complexities under
the hood, making it easier to work with logs stored in MongoDB after MapReduce processing.

## Architecture

The gateway implements a layered architecture comprising controller, service, and repository
components. 

## API Endpoints

Its RESTful interface exposes five core HTTP endpoints:

* GET /api/logs - Retrieves all logs
* GET /api/logs/{id} - Accesses individual log entry by ID
* DELETE /api/logs/{id} - Removes specific log entry from the system
* PUT /api/logs/{id} - Updates existing log entry
* POST /api/logs/ - Creates new log entry

## Documentation

API documentation available at: http://localhost:8080/swagger-ui/index.html