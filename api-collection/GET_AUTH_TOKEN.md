# Ako získať Supabase Auth Token pre Bruno

Existujú dva spôsoby, ako získať autentifikačný token pre testovanie API v Bruno:

## Možnosť 1: Cez Supabase Studio (Odporúčané)

1. **Spusti lokálny Supabase:**
   ```bash
   npx supabase start
   ```

2. **Otvor Supabase Studio:**
   Prejdi na [http://127.0.0.1:54323](http://127.0.0.1:54323)

3. **Prihlás sa:**
   - Email: `dev@example.com`
   - Heslo: (vytvor si heslo cez SQL alebo použij service_role_key)

4. **Získaj token:**
   - Prejdi do **Authentication** → **Users**
   - Klikni na používateľa `dev@example.com`
   - Skopíruj **Access Token** (JWT)

5. **Vlož do Bruno:**
   - Otvor `api-collection/collection.bru`
   - Nahraď `your-supabase-auth-token-here` skopírovaným tokenom

## Možnosť 2: Service Role Key (Len pre lokálny development!)

**⚠️ POZOR: Tento kľúč má plné práva! Nikdy ho nepoužívaj v produkcii!**

1. **Otvor `.env` súbor:**
   ```bash
   cat server/.env
   ```

2. **Skopíruj `SUPABASE_SERVICE_ROLE_KEY`:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Vlož do Bruno:**
   - Otvor `api-collection/collection.bru`
   - Nahraď `your-supabase-auth-token-here` týmto kľúčom

## Možnosť 3: Vytvor nového používateľa

Ak chceš vytvoriť vlastného testovacieho používateľa:

```sql
-- Spusti v Supabase SQL Editor (http://127.0.0.1:54323)

-- 1. Vytvor používateľa
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@jobhunter.local',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- 2. Získaj jeho ID
SELECT id, email FROM auth.users WHERE email = 'test@jobhunter.local';
```

Potom sa prihlás cez Supabase Studio s týmto emailom a heslom a získaj token.

## Overenie tokenu

Keď máš token, otestuj ho v Bruno:

1. Otvor `Health/Health Check.bru`
2. Klikni **Send**
3. Mal by si dostať `200 OK`

Ak to funguje, môžeš pokračovať s ostatnými requestami!

## Platnosť tokenu

- **Access Token** je platný **1 hodinu** (predvolene)
- Keď vyprší, musíš získať nový
- **Service Role Key** nikdy nevyprší (ale nemal by sa používať v produkcii)

## Bezpečnosť

**NIKDY necommituj skutočný token do gitu!**

Bruno kolekcia má placeholder `your-supabase-auth-token-here`, ktorý musíš nahradiť lokálne. Tento placeholder je bezpečný commitnúť.
