# JobHunter Server

Backend API for JobHunter.

## Prerequisites

Before running the server or tests, the local PostgreSQL/GCS docker-compose stack must be up.

## Run

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start
```

## Testing

```bash
# Watch mode
npm test

# Single run
npm run test:run
```

From monorepo root:

```bash
npm test -w server
npm run test:run -w server
```

## Environment Files

- `.env` for development fallback
- `.env.test` for Vitest

## Auth (Provider-Agnostic)

The middleware uses an internal `AuthContext` plus provider adapters.
For all auth variables and local mode toggles, use `server/.env.example` as the single source of truth.
The file contains inline comments for each auth variable, including where to find values in Auth0 UI.

## Local DB Reset

```bash
# From repo root
docker-compose down -v --remove-orphans
docker-compose up -d
npm run migrate
npm run seed
```
