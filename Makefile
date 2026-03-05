COMPOSE := docker compose

.PHONY: dev stop build logs logs-backend migrate migrate-dev seed shell-backend shell-db

dev:
	$(COMPOSE) up --build

stop:
	$(COMPOSE) down

build:
	$(COMPOSE) build --no-cache

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

migrate:
	$(COMPOSE) exec frontend sh -lc "npx prisma generate && npx prisma migrate deploy"
	$(COMPOSE) exec backend sh -lc "alembic upgrade head"

migrate-dev:
	$(COMPOSE) exec frontend sh -lc "npx prisma migrate dev"

seed:
	$(COMPOSE) exec frontend sh -lc "npx prisma generate && npx prisma db seed"

shell-backend:
	$(COMPOSE) exec backend sh

shell-db:
	@echo "Use your Neon DATABASE_URL with psql or Neon CLI"
