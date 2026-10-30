.PHONY: setup dev down logs seed migrate test e2e build-prod up-prod db-reset types
setup:
	pnpm install --frozen-lockfile
	pnpm run setup
dev: setup
	pnpm exec supabase start
	docker compose -f docker-compose.dev.yml up --build -d
down:
	docker compose -f docker-compose.dev.yml down
	pnpm exec supabase stop
logs:
	docker compose -f docker-compose.dev.yml logs -f
seed:
	pnpm seed
migrate:
	pnpm exec supabase migration up --local
test:
	docker compose -f docker-compose.dev.yml run --rm web sh -c "pnpm lint && pnpm typecheck && pnpm test"
e2e:
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from tests
build-prod:
	docker compose --env-file .env.production -f docker-compose.prod.yml build
up-prod:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d
db-reset:
	pnpm exec supabase db reset
types:
	pnpm db:types
