# Запуск всех сервисов в Docker

## Запуск всех контейнеров одной командой

Чтобы запустить все сервисы (MongoDB, Mongo-Express и RabbitMQ) одной командой, выполните следующую команду в терминале из папки `docker`:

```bash
docker-compose up -d
```

Это запустит все контейнеры в фоновом режиме.

## Проверка статуса контейнеров

Чтобы проверить, что все контейнеры запущены:

```bash
docker ps
```

## Доступ к веб-интерфейсам

### Mongo-Express (MongoDB Web UI)
- URL: http://localhost:8081
- Логин: admin
- Пароль: admin

### RabbitMQ Management UI
- URL: http://localhost:15672
- Логин: admin
- Пароль: admin

## Остановка всех контейнеров

Чтобы остановить все контейнеры:

```bash
docker-compose down
```

