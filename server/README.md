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

## Databáza

Server sa pripája k lokálnej Supabase inštancii:
- **URL**: `http://127.0.0.1:54321`
- **Schema**: `jobhunter`

Pre reset databázy:
```bash
# V root priečinku
npx supabase db reset
```
