# Demo Runbook

Инструкция для запуска демо-стенда и публикации наружу через `ngrok`.

## Требования

- Docker Desktop
- Node.js `>= 20.9`
- npm
- `ngrok`

## Предварительная проверка

В корне проекта должен быть `.env`.

Минимально проверь эти переменные:

```env
DATABASE_URL=...
DATABASE_URL_ASYNC=...
OPENAI_API_KEY=...
MINIO_ROOT_USER=...
MINIO_ROOT_PASSWORD=...
MINIO_BUCKET=...
REDIS_PASSWORD=...
NEXTAUTH_SECRET=...
PUBLIC_SESSION_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
PYTHON_BACKEND_URL=http://127.0.0.1:8000
APP_DOMAIN=localhost
```

Если `ngrok` еще не привязан к аккаунту, выполни команду со своим токеном:

```bash
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

Проверить, что `ngrok` доступен:

```bash
ngrok version
```

## Первый запуск

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026/frontend
npm ci
```

## Запуск демо

### 1. Поднять backend, Redis и MinIO

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026
docker compose up -d --build
```

Проверка:

```bash
docker compose ps
curl http://127.0.0.1:8000/health
```

### 2. Применить миграции и при необходимости выполнить seed

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026
make migrate
make seed
```

`make seed` нужен, если нужен admin-пользователь из `.env`.

### 3. Собрать frontend

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026/frontend
npm run build
```

### 4. Поднять tunnel и получить публичный URL

В отдельном терминале:

```bash
ngrok http 3000
```

Скопируй публичный `https://...` URL вида `https://<name>.ngrok-free.app`.

### 5. Запустить frontend с актуальным origin

Если tunnel уже поднят, перед стартом frontend подставь его URL:

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026/frontend
NEXTAUTH_URL=https://<your-ngrok-domain>.ngrok-free.app \
WEB_ORIGIN=https://<your-ngrok-domain>.ngrok-free.app \
PYTHON_BACKEND_URL=http://127.0.0.1:8000 \
npm run start -- -H 0.0.0.0 -p 3000
```

Почему так:

- `NEXTAUTH_URL` нужен для корректного login/callback flow
- `WEB_ORIGIN` нужен для ссылок и согласованного внешнего origin
- `PYTHON_BACKEND_URL` должен указывать на локальный backend на хосте

Если tunnel еще не запущен, для локальной проверки можно сначала поднять frontend так:

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026/frontend
NEXTAUTH_URL=http://localhost:3000 \
WEB_ORIGIN=http://localhost:3000 \
PYTHON_BACKEND_URL=http://127.0.0.1:8000 \
npm run start -- -H 0.0.0.0 -p 3000
```

## Проверка перед демо

Локально:

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/login
curl http://127.0.0.1:3000/api/health
```

Публично через `ngrok`:

```bash
curl -I https://<your-ngrok-domain>.ngrok-free.app/
curl -I https://<your-ngrok-domain>.ngrok-free.app/login
curl https://<your-ngrok-domain>.ngrok-free.app/api/health
```

Ручной smoke:

- главная страница открывается
- страница `/login` открывается
- вход под `ADMIN_EMAIL` / `ADMIN_PASSWORD` проходит
- `/api/health` отвечает JSON
- если нужен RAG, заранее загружен тестовый файл

## Если логин или редиректы ломаются

Проверь, что frontend запущен именно с текущим `ngrok` URL в:

- `NEXTAUTH_URL`
- `WEB_ORIGIN`

После смены `ngrok` URL frontend нужно перезапускать.

## Остановка

Остановить frontend и `ngrok`: `Ctrl+C` в соответствующих терминалах.

Остановить docker-сервисы:

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026
make stop
```

## Типовой порядок на следующий запуск

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026
docker compose up -d --build
make migrate
```

Дальше:

```bash
cd /Users/alexandrmoroz/Peona-Orange-Systems-2026/frontend
npm run build
```

Поднять `ngrok`, получить новый URL и стартовать frontend с актуальными `NEXTAUTH_URL` и `WEB_ORIGIN`.
