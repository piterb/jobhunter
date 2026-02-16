# Ako získať auth token pre Bruno (aktuálne)

Po migrácii zo Supabase sa už nepoužíva Supabase Auth endpoint.

## Local development

1. Spusti backend server v development móde:

```bash
cd server
npm run dev
```

2. V Bruno spusti request:
- `JobHunter / 01_Auth / Login (Dev Token)`  
  (volá `GET {{baseUrl}}/auth/dev-login`)

3. Request automaticky uloží `access_token` do premennej `authToken`.

## Dôležité

- Endpoint `/auth/dev-login` je dostupný iba pri `NODE_ENV=development`.
- Token je mock token určený iba na lokálne testovanie.
