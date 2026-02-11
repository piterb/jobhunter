# JobHunter - API Špecifikácia (Hybridná)

Tento dokument definuje rozhranie aplikácie JobHunter. Aplikácia využíva hybridný prístup:
1. **Supabase SDK**: Priama komunikácia z Frontendu (Next.js) do databázy pre základné CRUD operácie.
2. **Express Backend**: Vyhradený pre komplexnú logiku, AI funkcie a scraping.

## 1. Základné informácie

- **Backend Base URL:** `http://localhost:3001/api/v1`
- **Supabase Project URL:** Konfigurované cez `.env.local`
- **Formát:** JSON (`Content-Type: application/json`)

## 2. Autentifikácia & Bezpečnosť

Všetky API volania (aj na Supabase, aj na Express) vyžadujú platný **JWT Token**.
- **Supabase**: SDK automaticky prikladá token k požiadavkám.
- **Express Backend**: Vyžaduje hlavičku `Authorization: Bearer <ACCESS_TOKEN>`. Backend overuje token voči Supabase Auth.

---

## 3. Priama komunikácia (Supabase SDK)

Tieto operácie vykonáva Frontend priamo bez medzičlánku Express servera.

### 3.1 Jobs (Práce)
- `select` - Zoznam a detail prác (vynútené RLS).
- `insert` - Manuálne pridanie práce.
- `update` - Zmena statusu, poznámky.
- `delete` - Odstránenie práce.

### 3.2 Activities (Aktivity)
- `select` - Načítanie časovej osi pre konkrétny Job.
- `insert` - Pridanie manuálnej poznámky.

### 3.3 Profile (Profil & Nastavenia)
- `select / update` - Správa užívateľského profilu a globálnych nastavení (téma, jazyk).

---

## 4. Backend Endpointy (Express.js)

Endpointy pre funkcie, ktoré vyžadujú serverovú logiku alebo externé kľúče.

### 4.1 AI & Inteligentné funkcie

#### `POST /analyze/job` (Smart Ingest)
Analyzuje URL alebo text inzerátu a extrahuje štruktúrované dáta.
- **Vstup:** `{ "url": "...", "text": "..." }`
- **Výstup:** Štruktúrovaný JSON (title, company, skills, salary, atď.)
- **Logovanie:** Automaticky vytvára záznam v `ai_usage_logs`.

#### `POST /analyze/activity` (Smart Paste)
Analyzuje text (napr. email) a vráti navrhovanú kategóriu a sumár.
- **Vstup:** `{ "text": "..." }`
- **Výstup:** `{ "type": "...", "category": "...", "summary": "...", "date": "..." }`

#### `POST /generate/cover-letter`
Generuje motivačný list na mieru pre konkrétny Job.
- **Vstup:** `{ "jobId": "uuid", "customInstructions": "..." }`
- **Backend:** Načíta dáta o práci a profile zo Supabase a zavolá AI.
- **Výstup:** `{ "content": "Markdown text..." }`

### 4.2 Systém a Monitoring

#### `GET /ai-logs`
Zoznam histórie používania AI pre užívateľa.
- **Query:** `limit`, `offset`.
- **Výstup:** Paginated list logov.

#### `GET /health`
Health check pre monitoring backendu.

---

## 5. Dátový Modell & RLS

Hoci Express backend má service_role prístup, klientske požiadavky na Supabase sú prísne chránené cez **Row Level Security (RLS)**. Každý záznam musí patriť prihlásenému používateľovi (`auth.uid() = user_id`) a musí obsahovať metadáta `app_id: 'jobhunter'`.
