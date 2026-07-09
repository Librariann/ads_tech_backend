# Ads Tech Backend

NestJS API using PostgreSQL, TypeORM, JWT, Redis-backed sessions, and OAuth2.

## Local setup

```bash
npm install
cp .env.example .env.dev
docker compose up -d
npm run start:dev
```

The API listens on `http://localhost:8000` by default.
OAuth callbacks return to `FRONTEND_URL` after setting HttpOnly access and
refresh-token cookies. When the frontend and API use separate subdomains in
production, set `AUTH_COOKIE_DOMAIN` to their shared parent domain.

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

TypeORM schema synchronization is enabled outside production. Add and run
database migrations before deploying with `NODE_ENV=production`.
