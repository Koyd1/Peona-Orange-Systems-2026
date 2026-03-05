# HR Bot

Монорепо HR-ассистента (Next.js + FastAPI + RAG + pgvector).

## Статус

- Tasks `01`–`11`: `DONE`
- Task `12` (Polish/Prod/CI): `DONE`

## Состав

- `frontend/` — Next.js 15 (BFF + UI), запускается на хосте
- `backend/` — FastAPI (ingest/chat/health/evaluate), запускается в Docker
- `infra/` — nginx конфиг для production reverse proxy
- `tasks/` — декомпозиция и roadmap

## Prerequisites

- Docker + Docker Compose plugin
- Node.js 20+
- npm

## Быстрый старт (dev)

1. Подготовка env:

```bash
cp .env.example .env
```

2. Запуск backend/infra в Docker:

```bash
make dev
```

3. Запуск frontend на хосте:

```bash
cd frontend
npm install
npm run dev
```

4. Миграции:

```bash
make migrate
```

5. Seed admin:

```bash
make seed
```

Доступ:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- MinIO API: `http://localhost:9000`
- MinIO Console (dev only): `http://localhost:9001`

## Production запуск (compose override + host frontend)

Подготовка env:

```bash
cp prod.env.example .env
```

Preflight перед деплоем:

```bash
make prod-preflight
```

Сборка и запуск docker-части:

```bash
make prod-up
```

Запуск frontend на хосте:

```bash
cd frontend
npm ci
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

Остановка docker-части:

```bash
make prod-down
```

Что меняется в prod-режиме:

- backend собирается с `target: prod`
- backend запускается без `--reload`
- frontend не запускается в Docker (работает как host process)
- nginx в Docker проксирует трафик на frontend на хосте (`host.docker.internal:3000`)
- backend доступен на `127.0.0.1:8000`
- MinIO Console `:9001` скрыт
- `raganything` вынесен из базового production image (опциональная установка отдельным профилем)

## Nginx и TLS

- Конфиг: `infra/nginx.conf`
- Сертификаты: `infra/certs/cert.pem`, `infra/certs/key.pem`
- В репозитории есть self-signed cert для локального smoke-теста.
- Для production замените сертификаты реальными (ACME/Cloud cert).

## ENV matrix

Обязательные:

- `DATABASE_URL`
- `DATABASE_URL_ASYNC`
- `OPENAI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`
- `REDIS_PASSWORD`
- `PYTHON_BACKEND_URL` (для host-runtime: `http://127.0.0.1:8000`)

Рекомендуемые:

- `OPENAI_CHAT_MODEL`
- `OPENAI_CHAT_FALLBACK_MODELS`
- `OPENAI_JUDGE_MODEL`
- `RAG_TOP_K`, `RAG_SIM_THRESHOLD`
- `HEALTH_OPENAI_WARN_MS`, `HEALTH_HALL_WARN_THRESHOLD`
- `APP_DOMAIN`

## CI

Workflow: `.github/workflows/ci.yml`

Пайплайн:

1. `quality`:
- frontend typecheck
- frontend production build
- backend compile check

2. `migrations-smoke`:
- PostgreSQL + pgvector service
- `prisma migrate deploy`
- `alembic upgrade head`

3. `docker-build`:
- сборка production образов (`backend`, `nginx`)

## Optional dependencies

`raganything` не входит в базовый `backend/requirements.txt`, чтобы production build оставался предсказуемым по времени и размеру.
Если нужен экспериментальный режим с `raganything`, устанавливайте его отдельным слоем/образом.

## Health/Quality контроль

- `GET /api/health` (frontend proxy)
- `GET /api/v1/health/detailed` (backend)
- `POST /api/v1/evaluate` (hallucination judge)
- Admin UI: `/admin/health`

## Runbook деплоя

1. Обновить `.env` production-секретами.
2. Проверить, что нет `CHANGE_ME` значений.
3. Выполнить `make prod-up`.
4. Запустить frontend на хосте (`npm ci && npm run build && npm run start -- -H 0.0.0.0 -p 3000`).
5. Проверить:
- `https://<domain>/healthz`
- `https://<domain>/api/health`
- login + chat smoke-flow

## Rollback checklist

1. Вернуть предыдущий commit/tag.
2. Выполнить `make prod-up` для пересборки предыдущего релиза backend/nginx.
3. Перезапустить frontend на хосте с версией из rollback.
4. Проверить health endpoints.
5. Проверить login/chat/admin smoke.

## Полезные команды

```bash
make logs
make logs-backend
make shell-backend
make prod-build
```
