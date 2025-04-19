# MongoDB Docker Configuration

This directory contains the necessary files to build and run MongoDB in Docker with GitHub secrets.

## Files

- `Dockerfile`: MongoDB image configuration
- `mongod.conf`: MongoDB server configuration
- `docker-compose.yml`: Docker Compose setup for MongoDB
- `.github/workflows/mongodb-deploy.yml`: GitHub Actions workflow for deployment

## GitHub Secrets Setup

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Add the following secrets:
   - `MONGO_ROOT_USERNAME`: MongoDB admin username
   - `MONGO_ROOT_PASSWORD`: MongoDB admin password
   - `MONGO_DATABASE`: Default database name

## Local Development

For local development, create a `.env` file in the `docker/mongoDB` directory:

```
MONGO_ROOT_USERNAME=dev_user
MONGO_ROOT_PASSWORD=dev_password
MONGO_DATABASE=dev_db
```

Then run:

```bash
cd docker/mongoDB
docker-compose up -d
```

## Deployment

Push changes to the `main` branch or manually trigger the workflow in GitHub Actions.

## Connecting to MongoDB

- Host: localhost (or your server hostname)
- Port: 27017
- Authentication Database: admin
- Username: Value of `MONGO_ROOT_USERNAME`
- Password: Value of `MONGO_ROOT_PASSWORD`

## Security Best Practices

- Never commit sensitive information to the repository
- Rotate secrets periodically
- Use strong, unique passwords
- Limit network access in production environments

### Starting MongoDB

To start MongoDB using Docker Compose:

```bash
cd docker/mongoDB
docker-compose up -d
```

### Connecting to MongoDB

You can connect to MongoDB using:

- Host: localhost
- Port: 27017
- Authentication Database: admin
- Username: admin
- Password: password

For applications, use:
- Database: logs_db
- Username: app_user
- Password: app_password

### Stopping MongoDB

```bash
docker-compose down
```

To completely remove volumes and data:

```bash
docker-compose down -v
``` 