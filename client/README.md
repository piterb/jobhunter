# JobHunter Client

Frontend Next.js app for the JobHunter dashboard.

## Run

```bash
npm run dev -w client
```

## Local Auth Modes

Frontend auth flow is controlled from `client/.env.local`.
Use `client/.env.example` as the single source of truth for all auth variables and mode toggles (`dev` vs `auth0`).
That file contains inline comments showing where to find each value in Auth0/Google UI.

After editing `.env.local`, restart `npm run dev -w client`.
