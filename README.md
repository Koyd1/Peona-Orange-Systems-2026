# HR Bot

## Quick Start (Task 01 Foundation)

### 1. Подготовка
- Установить Docker + Docker Compose v2.
- Скопировать шаблон окружения:

```bash
cp .env.example .env
```

В `.env` вставить ваши реальные Neon credentials (`DATABASE_URL`, `DATABASE_URL_ASYNC`) и остальные секреты.

### 2. Запуск локального стека

```bash
make dev
```

Сервисы:
- App: http://localhost:3000
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001

### 3. Управление

```bash
make stop
make logs
make logs-backend
```

## Команды миграций (подготовлены для следующих задач)

```bash
make migrate
make migrate-dev
make seed
```

Примечание: на этапе Task 01 backend/frontend работают как foundation scaffold. Функциональная логика auth/RAG/chat будет добавляться в задачах 02+.
