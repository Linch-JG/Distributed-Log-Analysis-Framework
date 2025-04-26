# Запуск всех сервисов в Docker

## Запуск всех контейнеров одной командой

Чтобы запустить все сервисы (MongoDB, Mongo-Express и RabbitMQ) одной командой, выполните следующую команду в терминале из папки `docker`:

```bash
docker compose up -d
```

Это запустит все контейнеры в фоновом режиме.

Чтобы остановить все контейнеры ипользуйте:

```bash
docker compose down -v
```


Чтобы проверить, что все контейнеры запущены:

```bash
docker ps
```

## Доступ к веб-интерфейсам

### Mongo-Express (MongoDB Web UI, might take some time to boot)
- URL: http://localhost:8081
- Логин: admin
- Пароль: admin

#### MongoDB container:
- port: 27018
- Логин: admin
- Пароль: admin

### RabbitMQ Management UI
- URL: http://localhost:15672
- Логин: admin
- Пароль: admin

### Kafka UI
- URL: http://localhost:8080
- Не требует аутентификации

## Storing login/password in .env

See ```.env.example ```




