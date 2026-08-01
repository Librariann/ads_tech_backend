# Ads Tech Backend

NestJS API using PostgreSQL, TypeORM, JWT, Redis-backed sessions, and OAuth2.

## Local setup

```bash
npm install
cp .env.example .env.dev
docker compose up -d
npm run migration:run
npm run start:dev
```

The API listens on `http://localhost:8000` by default. OAuth callbacks create a
short-lived, single-use handoff code in Redis and redirect to
`FRONTEND_URL/api/auth/oauth/callback`. The frontend exchanges that code
server-to-server and sets its own HttpOnly access and refresh-token cookies, so
the frontend and API can use unrelated domains.

## Authentication

Local authentication:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout` (Bearer token required)
- `POST /auth/logout-all` (Bearer token required)
- `GET /auth/me` (Bearer token required)

OAuth2 entry points:

- `GET /auth/oauth/google`
- `GET /auth/oauth/naver`
- `GET /auth/oauth/kakao`
- `POST /auth/oauth/exchange` (single-use code exchange)

Register these callback URLs in each provider console:

```text
http://localhost:8000/auth/oauth/google/callback
http://localhost:8000/auth/oauth/naver/callback
http://localhost:8000/auth/oauth/kakao/callback
```

Set the matching client ID and secret values in `.env.dev`. Kakao's client
secret is optional when that feature is disabled in the Kakao console.

Access tokens are JWTs with a short lifetime. Refresh tokens are rotated on
every use, while session state and refresh-token hashes are stored in Redis.
Logging out removes the Redis session and immediately revokes its access token.

## Verification

```bash
npm run build
npm run lint
NODE_ENV=dev npm run test:e2e -- --runInBand
```

TypeORM schema synchronization is disabled in every environment. Database
changes are applied only through committed migrations.

## Database migrations

Schema synchronization is disabled in every environment. Apply committed
migrations before starting the API:

```bash
npm run migration:show
npm run migration:run
```

Create a migration after changing entity metadata:

```bash
npm run migration:generate -- src/database/migrations/DescribeChange
```

Revert only the latest migration:

```bash
npm run migration:revert
```
