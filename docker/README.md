# Running all Services in Docker

## Running all containers with one command

To launch all services with a single command, run the following commandl:

```bash
cd docker
docker compose up -d --build
```

This will start all containers in background mode.

To stop all containers use:

```bash
docker compose down -v
```

To verify that all containers are running:

```bash
docker ps
```
## Storing login/password in .env

See ```.env.example ```



