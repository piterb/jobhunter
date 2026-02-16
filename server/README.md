# JobHunter Server

Backend API pre JobHunter aplikáciu.

## Predpoklady

Pred spustením servera alebo testov musí bežať **Supabase**:

```bash
# V root priečinku projektu
npx supabase start
```

## Spustenie servera

```bash
# Development mode s hot reload
npm run dev

# Production build
npm run build
npm start
```

## Testovanie

### Spustenie testov

```bash
# Watch mode (automaticky sa znovu spúšťajú pri zmenách)
npm test

# Jednorázové spustenie
npm run test:run
```

### Spustenie z root priečinka

```bash
# Z root priečinka projektu
npm test -w server
npm run test:run -w server
```

### Čo sa testuje

- **Health API** - Overuje, že API beží
- **Jobs API** - CRUD operácie pre práce (Create, Read, Update, Delete)

Testy používajú:
- **Vitest** - Test runner
- **Supertest** - HTTP testovanie
- **Lokálnu Supabase databázu** - Integračné testy proti reálnej DB

### Štruktúra testov

```
server/src/__tests__/
├── setup.ts           # Načítanie ENV premenných pre testy
├── health.test.ts     # Testy pre health endpoint
└── jobs.test.ts       # Testy pre jobs API
```

## Premenné prostredia

Server používa tieto ENV súbory:
- `.env` - Pre development
- `.env.test` - Pre testy (automaticky načítané Vitestom)

### Auth (provider-agnostic)

Auth middleware používa interný `AuthContext` kontrakt a provider adapter:

- `AUTH_PROVIDER=auth0|keycloak`
- `AUTH_LOCAL_DEV_USE_MOCK_IDENTITY=true|false` (v developmente default `true`)
- `OIDC_ISSUER` + `OIDC_AUDIENCE` (alebo fallback `AUTH0_ISSUER_BASE_URL` + `AUTH0_AUDIENCE`)
- `OIDC_CLIENT_ALLOWLIST` (voliteľné, CSV)
- `AUTH_ENFORCE_APP_CLAIMS=true|false`
- `AUTH_APP_ID_CLAIM` (default `app_id`)
- `AUTH_APP_ENV_CLAIM` (default `app_env`)

Prepnutie na iného OIDC providera je navrhnuté ako zmena `AUTH_PROVIDER` + OIDC configu, bez zásahu do route/business vrstvy.

## Databáza

Server sa pripája k lokálnej Supabase inštancii:
- **URL**: `http://127.0.0.1:54321`
- **Schema**: `jobhunter`

Pre reset databázy:
```bash
# V root priečinku
npx supabase db reset
```
