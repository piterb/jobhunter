# 🎯 JobHunter - Technická Špecifikácia (MVP)

## 1. Prehľad projektu
JobHunter je desktop-first webová aplikácia navrhnutá na inteligentné sledovanie a správu procesu hľadania práce. Nástroj nahrádza statické tabuľky automatizovaným systémom, ktorý využíva AI na parsovanie inzerátov a histórie komunikácie.

## 2. Architektúra a Tech Stack
- **Architecture:** Monorepo (Client + Server + Shared).
- **Frontend:** Next.js (React) - Beží na porte 3000.
- **Backend:** Node.js (Express) - Beží na porte 3001/4000.
- **Databáza:** Supabase (PostgreSQL).
- **Auth:** Google OAuth (Supabase Auth pre Client, JWT verifikácia na Serveri).
- **AI Integrácia:** OpenAI API (Volané výhradne zo Servera).
- **Export:** SheetJS (Excel) a PapaParse (CSV).

## 3. Dátový Model (Rigidná štruktúra)

### 3.1 Tabuľka: `jobs` (Hlavná entita)
| Pole | Typ | Povinné | Poznámka |
| :--- | :--- | :--- | :--- |
| **id** | UUID | Áno | Primárny kľúč. |
| **title** | String | Áno | Názov pozície (napr. Python Dev). |
| **company** | String | Áno | Názov firmy. |
| **status** | Enum | Áno | Draft, Applied, Interview, Offer, Rejected, Ghosted. |
| **employment_type**| Enum | Áno | Full-time, Part-time, Contract, Internship. |
| **salary_min** | Int | Nie | Mesačne v EUR. |
| **salary_max** | Int | Nie | Mesačne v EUR. |
| **location** | String | Nie | Mesto alebo "Remote". |
| **skills_tools** | String | Nie | Čiarkou oddelené (napr. SAP, Excel). |
| **url** | String | Áno | Unikátny link na inzerát (Indexovaný). |
| **applied_at** | DateTime | Nie | Kedy bolo reálne odoslané CV. |
| **last_activity** | DateTime | Áno | Timestamp poslednej zmeny (Ghosting tracking). |
| **notes** | Text | Nie | AI vygenerovaný súhrn inzerátu (Markdown). |

### 3.2 Tabuľka: `activities` (Timeline / CRM)
| Pole | Typ | Povinné | Poznámka |
| :--- | :--- | :--- | :--- |
| **id** | UUID | Áno | Primárny kľúč. |
| **job_id** | UUID | Áno | Relácia 1:N k tabuľke Jobs. |
| **event_type**| Enum | Áno | Manual, Email, Call, Status_Change. |
| **category** | Enum | Nie | Interview, Offer, Rejection, Question. |
| **content** | Text | Áno | Sumár správy alebo text poznámky. |
| **checksum** | String | Áno | SHA-256 hash (deduplikácia emailov). |
| **created_at** | DateTime | Áno | Čas kedy sa udalosť reálne stala. |

## 4. Kľúčové Funkcionality

### 4.1 Smart Ingest (Single URL Fetch)
- **Vstup:** Používateľ vloží URL inzerátu.
- **Proces:**
  1. Backend (alebo klient) stiahne surové HTML/Text z danej URL.
  2. Backend bezpečne zavolá OpenAI API (API kľúče sú len na serveri).
  3. AI namapuje text na rigidné polia (Title, Salary, Stack...).
- **Validácia:** Používateľ skontroluje a potvrdí predvyplnené dáta pred uložením.

### 4.2 Inteligentná História (Timeline)
- **Smart Paste:** Používateľ skopíruje text mailu a vloží ho do aplikácie.
- **AI Cleaning:** AI extrahuje z textu dátum, odosielateľa a vytvorí stručný sumár bez zbytočnej "vaty" (podpisy, patičky).
- **Idempotencia:** Systém na základe hashu (Dátum + Odosielateľ + Predmet) zabráni duplicite toho istého mailu v histórii.

### 4.3 Dashboard & UI
- **Tabuľkový View:** Hlavná obrazovka s výkonným filtrovaním a sortovaním.
- **Side-Panel Detail:** Po kliknutí na riadok sa vysunie panel s kompletnou časovou osou (Timeline) a možnosťou pridávať manuálne poznámky.
- **Ghosting Alarm:** Vizuálne zvýraznenie (napr. červený border), ak je práca v stave `Applied` (alebo inom aktívnom stave) dlhšie ako definovaný počet dní (default 14) bez novej aktivity. Tento limit si používateľ môže nastaviť v profile. Status sa môže automaticky prepnúť na `Ghosted` po prekročení limitu alebo podľa rozhodnutia používateľa.

### 4.4 Export a Nastavenia
- **Auth:** Google OAuth (žiadne heslá v DB).
- **API Keys:** Uložené bezpečne na Backende (Environment variables / Encrypted DB), klient k nim nemá prístup.
- **API Keys & Logika:** Všetka komunikácia s LLM a spracovanie dát prebieha na serveri (Backend-for-Frontend pattern).
- **Fetch:** Implementácia rešpektujúca `robots.txt` a základné hlavičky prehliadača.
- **Export:** Jednoúčelové tlačidlá na okamžitý export aktuálneho zoznamu do `.xlsx` alebo `.csv`.
- **Dáta:** Striktne oddelené tabuľky pre zachovanie konzistencie (Rigid Model).

## 5. UI/UX Rozloženie (Wireframe koncept)
- **Login Screen:** Jednoduché tlačidlo "Sign in with Google".
- **Hlavička:** Logo, Input pole pre novú URL, User Avatar (Google profil), Tlačidlo "Add".
- **Stred:** Veľká interaktívna tabuľka so stĺpcami: Status, Firma, Pozícia, Plat, Posledná aktivita.
- **Pravý panel (po kliku):** Detail pozície, Markdown poznámky, Vertikálna časová os aktivít.

## 7. Štruktúra Projektu (Monorepo)
```
/jobhunter (Root)
├── package.json          # Workspaces config (npm/turbo)
├── shared/               # Zdieľané typy (TypeScript Interfaces)
│   ├── index.ts          # export * from './types'
│   └── types/            # Definície pre FE aj BE
│       └── jobs.ts       # interface Job, JobStatus, Activity
│
├── client/               # Frontend (Next.js App Router)
│   ├── package.json
│   ├── .env.local        # Verejné kľúče (Supabase Anon Key)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/   # Login stránky
│   │   │   ├── (main)/   # Hlavná aplikácia (Dashboard)
│   │   │   └── layout.tsx
│   │   ├── components/   # UI Komponenty (vlastné + knižnica)
│   │   └── lib/
│   │       ├── api.ts    # Klient pre volanie nášho Express API
│   │       └── supabase.ts # Klient pre Auth a RLS
│
└── server/               # Backend (Express.js)
    ├── package.json
    ├── .env              # Tajné kľúče (OpenAI Key, Supabase Service Role)
    ├── src/
    │   ├── index.ts      # Server entry point (App setup + Listen)
    │   ├── routes/       # API definície (napr. POST /ingest)
    │   ├── controllers/  # Logika requestov (validácia, volanie service)
    │   ├── services/     # Biznis logika (OpenAI, Scraping, DB)
    │   └── middleware/   # Auth check (Overenie Supabase JWT)
```
