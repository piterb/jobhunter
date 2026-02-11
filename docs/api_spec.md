# JobHunter - API Špecifikácia

Tento dokument definuje rozhranie (API), ktoré poskytuje backend (Express.js) pre frontend (Next.js).

## 1. Základné informácie

- **Base URL:** `http://localhost:3001/api/v1` (bude konfigurovateľné cez ENV)
- **Formát:** JSON (`Content-Type: application/json`)
- **Dátumy:** ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`)

## 2. Autentifikácia & Bezpečnosť

Všetky chránené endpointy vyžadujú platný **Bearer Token** v hlavičke `Authorization`.
Tento token (JWT) získava frontend po prihlásení cez Supabase Auth a posiela ho backendu. Backend overuje podpis a platnosť tokenu voči Supabase projektu.

**Hlavička:**
`Authorization: Bearer <ACCESS_TOKEN>`

**Chybové stavy Auth:**
- `401 Unauthorized`: Chýbajúci alebo neplatný token.
- `403 Forbidden`: Token je platný, ale užívateľ nemá právo na daný zdroj.

## 3. Endpointy

### 3.1 Práca (Jobs)

Hlavná entita aplikácie.

#### `GET /jobs`
Vráti zoznam všetkých sledovaných pozícií pre prihláseného užívateľa.

- **Query Parametre (voliteľné):**
  - `status`: Filter podľa statusu (napr. `applied`, `interview`).
  - `sort`: `created_at` (default), `last_activity`, `salary`.
  - `order`: `asc`, `desc`.
  
- **Response `200 OK`:**
```json
[
  {
    "id": "uuid",
    "title": "Senior React Developer",
    "company": "TechCorp",
    "status": "Applied",
    "location": "Remote",
    "salary_min": 3000,
    "salary_max": 5000,
    "last_activity": "2023-10-25T14:00:00Z"
  },
  ...
]
```

#### `POST /jobs`
Vytvorenie novej pozície (manuálne alebo po potvrdení scanalýzy).

- **Body:**
```json
{
  "title": "Job Title",       // Povinné
  "company": "Company Name",  // Povinné
  "url": "https://...",       // Povinné (unikátne)
  "status": "Saved",          // Enum: Saved, Applied, ...
  "location": "Bratislava",
  "salary_min": 2000,
  "salary_max": 3500,
  "description": "Full HTML or Text content...",
  // ... ďalšie polia podľa dátového modelu
}
```

- **Response `201 Created`:** Vráti vytvorený objekt `Job`.

#### `GET /jobs/:id`
Detail konkrétnej pozície.

- **Response `200 OK`:** Objekt `Job` + voliteľne posledné aktivity (ak sa tak dohodne, inak samostatný endpoint).

#### `PUT /jobs/:id`
Aktualizácia pozície (napr. zmena statusu, poznámky).

- **Body:** Partial object (napr. `{ "status": "Interview" }`).
- **Response `200 OK`:** Aktualizovaný objekt.

#### `DELETE /jobs/:id`
Odstránenie pozície (soft delete alebo hard delete podľa potreby).

---

### 3.2 Aktivity (Activities)

Timeline udalosti pre konkrétny Job.

#### `GET /jobs/:id/activities`
Vráti chronologickú históriu aktivít pre daný job.

- **Response `200 OK`:**
```json
[
  {
    "id": "uuid",
    "type": "email", // manual, email, call...
    "content": "Pozvánka na pohovor...",
    "created_at": "2023-10-26T09:00:00Z"
  },
  ...
]
```

#### `POST /jobs/:id/activities`
Pridanie novej aktivity (poznámka, log hovoru).

- **Body:**
```json
{
  "type": "note",
  "content": "Volali mi, že sa ozvú budúci týždeň."
}
```

- **Response `201 Created`:** Vytvorená aktivita.

---

### 3.3 AI & Smart Features

Endpointy, ktoré využívajú LLM na spracovanie textu. Tieto endpointy dáta neukladajú, len vracajú spracovaný výsledok pre náhľad na FE.

#### `POST /analyze/job` (Smart Ingest)
Analyzuje URL alebo text inzerátu a extrahuje štruktúrované dáta.

- **Body:**
```json
{
  "url": "https://linkedin.com/jobs/..." 
  // alebo "text": "Raw text inzerátu..."
}
```

- **Response `200 OK`:**
```json
{
  "title": "Python Backend Dev",
  "company": "Startup s.r.o.",
  "skills": ["Django", "Docker", "PostgreSQL"],
  "salary_min": 2500,
  "salary_max": null,
  "location": "Košice / Remote"
  // ... predvyplnené dáta pre formulár
}
```

#### `POST /analyze/activity` (Smart Paste)
Analyzuje text (napr. skopírovaný email) a navrhne typ aktivity a sumár.

- **Body:**
```json
{
  "text": "Dobrý deň, ďakujeme za záujem. Radi by sme vás pozvali na pohovor..."
}
```

- **Response `200 OK`:**
```json
{
  "type": "email",
  "category": "interview_invitation",
  "summary": "Pozvánka na pohovor",
  "date": "2023-11-01T10:00:00" // ak je detegovaný dátum v texte
}
```

---

### 3.4 Užívateľ & Nastavenia (Settings)

#### `GET /settings`
Získa globálne nastavenia aplikácie pre užívateľa.

- **Response `200 OK`:**
```json
{
  "theme": "dark",
  "language": "sk",
  "auto_parse": true,
  "monthly_spend_limit": 5.00,
  "ghosting_threshold_days": 14
}
```

#### `PUT /settings`
Aktualizácia nastavení.

- **Body:** Partial object.

#### `GET /settings/integrations`
Stav integrácií (napr. či je nastavený OpenAI kľúč).

- **Response `200 OK`:**
```json
{
  "openai": {
    "enabled": true,
    "model": "gpt-4-turbo",
    "last_used": "2023-10-27T10:00:00Z"
  }
}
```

#### `PUT /settings/integrations`
Nastavenie API kľúčov (posielané bezpečne, na serveri šifrované).

- **Body:**
```json
{
  "provider": "openai",
  "api_key": "sk-proj-...",
  "enabled": true
}
```

---

### 3.5 Profil (Profile)

#### `GET /profile`
Získa profil užívateľa (ak ukladáme extra dáta mimo Supabase Auth).

#### `POST /profile/cv`
Upload životopisu pre analýzu a kontext AI.

- **Format:** `multipart/form-data`
- **Field:** `file` (PDF, DOCX, TXT)

---

### 3.6 System

#### `GET /health`
Health check pre monitoring. Vracia `{ "status": "ok", "timestamp": "..." }`.
