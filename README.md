# HR Bot

Монорепо HR-ассистента (Next.js + FastAPI + RAG + pgvector).

## Статус

- Tasks `01`–`11`: `DONE`
- Task `12` (Polish/Prod/CI): `DONE`

## Состав

- `frontend/` — Next.js 15 (BFF + UI)
- `backend/` — FastAPI (ingest/chat/health/evaluate)
- `infra/` — nginx конфиг для production reverse proxy
- `tasks/` — декомпозиция и roadmap

## Быстрый старт (dev)

1. Подготовка env:

```bash
cp .env.example .env
```

2. Запуск стека:

```bash
make dev
```

3. Миграции:

```bash
make migrate
```

4. Seed admin:

```bash
make seed
```

Доступ:

- Frontend: `http://localhost:3000`
- MinIO API: `http://localhost:9000`
- MinIO Console (dev only): `http://localhost:9001`

## Production запуск (compose override)

Подготовка env:

```bash
cp prod.env.example .env
```

Preflight перед деплоем:

```bash
make prod-preflight
```

Сборка и запуск:

```bash
make prod-up
```

Остановка:

```bash
make prod-down
```

Что меняется в prod-режиме:

- backend/frontend собираются с `target: prod`
- backend запускается без `--reload`
- frontend запускается через `next start`
- frontend не публикует порт напрямую
- трафик идет через `nginx` (`80/443`)
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
- `PYTHON_BACKEND_URL`

Рекомендуемые:

- `OPENAI_CHAT_MODEL`
- `OPENAI_JUDGE_MODEL`
- `RAG_TOP_K`, `RAG_SIM_THRESHOLD`
- `HEALTH_OPENAI_WARN_MS`, `HEALTH_HALL_WARN_THRESHOLD`
- `APP_DOMAIN`

## CI

Workflow: `.github/workflows/ci.yml`

Пайплайн:

1. `quality`:
- frontend typecheck
- backend compile check

2. `migrations-smoke`:
- PostgreSQL + pgvector service
- `prisma migrate deploy`
- `alembic upgrade head`

3. `docker-build`:
- сборка production образов

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
4. Проверить:
- `https://<domain>/healthz`
- `https://<domain>/api/health`
- login + chat smoke-flow

## Rollback checklist

1. Вернуть предыдущий commit/tag.
2. Выполнить `make prod-up` для пересборки предыдущего релиза.
3. Проверить health endpoints.
4. Проверить login/chat/admin smoke.

## Полезные команды

```bash
make logs
make logs-backend
make shell-backend
make prod-build
```
