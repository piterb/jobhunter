# 🗄️ Dátový Model a Správa Databázy

Tento dokument definuje schému databázy, bezpečnostné pravidlá a proces riadenia zmien pre aplikáciu JobHunter.

## 1. Prehľad Databázy

- **Databázový Engine:** PostgreSQL 15+ (hôstované na Supabase).
- **Schéma:** `jobhunter` (hlavná schéma aplikácie), `auth` (pre používateľov - spravované Supabase).
- **Autentifikácia:** Supabase Auth (Google OAuth).
- **App Isolation:** Prístup k dátam je podmienený prítomnosťou `id` používateľa a `app_id: 'jobhunter'` v metadátach JWT tokenu.

## 2. Architektúra a Bezpečnosť

Aby sme obišli limit 2 free projektov na Supabase, JobHunter beží v **samostatnej schéme** (`jobhunter`) v rámci zdieľanej inštancie.

### 2.1 RLS s Izoláciou Aplikácie
Každá tabuľka v schéme `jobhunter` má zapnuté Row Level Security (RLS). Prístup je povolený len vtedy, ak:
1.  Používateľ je prihlásený (`auth.uid()` nie je null).
2.  `user_id` v zázname sa zhoduje s `auth.uid()`.
3.  JWT token obsahuje v `app_metadata` kľúč `"app_id": "jobhunter"`.

**Helper funkcia pre RLS:**
```sql
CREATE OR REPLACE FUNCTION jobhunter.is_app_authorized()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata' ->> 'app_id') = 'jobhunter'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. ER Diagram (Logický model)


(Pozri diagram v: [docs/diagrams/er_model.mermaid](./diagrams/er_model.mermaid))

```mermaid
erDiagram
    %% Obsah je v súbore docs/diagrams/er_model.mermaid
```

## 4. SQL Inicializačný Skript (DDL)

```sql
-- 1. Vytvorenie schémy
CREATE SCHEMA IF NOT EXISTS jobhunter;

-- 2. ENUM Typy
DO $$ BEGIN
    CREATE TYPE jobhunter.job_status AS ENUM ('draft', 'applied', 'interview', 'offer', 'rejected', 'ghosted');
    CREATE TYPE jobhunter.emp_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'b2b');
    CREATE TYPE jobhunter.event_type AS ENUM ('note', 'status_change', 'email', 'call', 'meeting');
    CREATE TYPE jobhunter.activity_cat AS ENUM ('interview', 'offer', 'rejection', 'question', 'info');
    CREATE TYPE jobhunter.doc_type AS ENUM ('resume', 'cover_letter', 'certificate', 'diploma', 'other');
    CREATE TYPE jobhunter.ai_feature AS ENUM ('job_analysis', 'smart_paste', 'cover_letter_gen', 'chat');
    CREATE TYPE jobhunter.ai_status AS ENUM ('success', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabuľky
CREATE TABLE IF NOT EXISTS jobhunter.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text,
    last_name text,
    full_name text,
    avatar_url text,
    professional_headline text,
    onboarding_completed boolean DEFAULT false,
    theme text DEFAULT 'dark',
    language text DEFAULT 'en',
    openai_api_key text, -- Encrypted at rest
    default_ai_model text DEFAULT 'gpt-4o-mini',
    ghosting_threshold_days integer DEFAULT 14,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobhunter.jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES jobhunter.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    company text NOT NULL,
    status jobhunter.job_status NOT NULL DEFAULT 'draft',
    employment_type jobhunter.emp_type NOT NULL DEFAULT 'full_time',
    salary_min integer,
    salary_max integer,
    location text,
    skills_tools text[],
    url text,
    date_posted date,
    experience_level text,
    contact_person text,
    contact_email text,
    contact_phone text,
    contact_linkedin text,
    applied_at timestamptz,
    last_activity timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobhunter.activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES jobhunter.jobs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES jobhunter.profiles(id) ON DELETE CASCADE,
    event_type jobhunter.event_type NOT NULL,
    category jobhunter.activity_cat,
    content text NOT NULL, -- Main summary or manual note
    raw_content text, -- Original unedited text (e.g. from Outlook)
    metadata jsonb DEFAULT '{}'::jsonb,
    checksum text, -- Unique hash for deduplication
    occurred_at timestamptz DEFAULT now(), -- Real time of event (extracted from email)
    created_at timestamptz DEFAULT now() -- Time of record creation
);

-- Index for fast deduplication check
CREATE INDEX IF NOT EXISTS idx_activities_job_checksum ON jobhunter.activities(job_id, checksum);


CREATE TABLE IF NOT EXISTS jobhunter.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES jobhunter.profiles(id) ON DELETE CASCADE,
    document_type jobhunter.doc_type NOT NULL DEFAULT 'other',
    name text NOT NULL,
    storage_path text NOT NULL,
    content_text text,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobhunter.ai_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES jobhunter.profiles(id) ON DELETE CASCADE,
    feature jobhunter.ai_feature NOT NULL,
    model text NOT NULL,
    prompt_summary text,
    tokens_input integer DEFAULT 0,
    tokens_output integer DEFAULT 0,
    cost numeric(10, 6) DEFAULT 0,
    latency_ms integer,
    status jobhunter.ai_status NOT NULL DEFAULT 'success',
    request_json jsonb DEFAULT '{}'::jsonb,
    response_json jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 4. RLS Nastavenia
ALTER TABLE jobhunter.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobhunter.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 5. Helper pre JWT check
CREATE OR REPLACE FUNCTION jobhunter.is_app_authorized()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'app_id') = 'jobhunter';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Politiky (Ukážka pre 'jobs')
CREATE POLICY "Users manage their own jobs in jobhunter app"
ON jobhunter.jobs
FOR ALL
USING (
    auth.uid() = user_id 
    AND jobhunter.is_app_authorized()
);

-- ... (Podobne pre ostatné tabuľky)
```

## 5. Riadenie Zmien Databázy (Change Management)

Na správu databázovej schémy budeme používať **Supabase CLI**. Tento prístup zaručuje, že všetky zmeny sú verzionované v Gite a replikovateľné.

### Workflow

1.  **Lokálny Vývoj**:
    -   Vývojár má spustený lokálny Supabase stack: `npx supabase start`.
    -   Zmeny v schéme robí buď cez lokálne Studio (`http://localhost:54323`) alebo písaním SQL.
    
2.  **Vytvorenie Migrácie**:
    ```bash
    npx supabase db diff -f init_jobhunter_schema
    ```

3.  **Generovanie Typov**:
    ```bash
    npx supabase gen types typescript --local > shared/types/supabase.ts
    ```

---
*Tento dokument slúži ako záväzný podklad pre implementáciu databázovej vrstvy v samostatnej schéme.*
