# Infrastart & Deployment Dataflow

Tento dokument popisuje tok konfiguračných údajov, premenných a tajomstiev (secrets) medzi jednotlivými komponentmi systému počas inicializácie infraštruktúry a následného deploymentu.

## 1. Matica dátového toku

| Názov premennej | Zdroj (Odkiaľ) | Cieľ (Kam) | Kategória | Účel |
| :--- | :--- | :--- | :--- | :--- |
| **GCP_PROJECT_ID** | Používateľ (CLI) | GitHub Variable | Infra Start | Identifikácia projektu v Google Cloud. |
| **GCP_REGION** | Používateľ (CLI) | GitHub Variable | Infra Start | Región pre nasadenie služieb. |
| **ARTIFACT_REPO** | Vygenerované (CLI) | GitHub Variable | Infra Start | URL úložiska pre Docker obrazy (`region-docker.pkg.dev/...`). |
| **APP_NAME** | Používateľ (CLI) | GitHub Variable | Infra Start | Základné meno aplikácie použité pre ServiceName a DB tabuľky. |
| **GCP_WIF_PROVIDER** | Vygenerované (GCP) | GitHub Secret | Infra Start | Cesta k Workload Identity Provideru. |
| **GCP_SA_EMAIL** | Vygenerované (GCP) | GitHub Secret | Infra Start | Email servisného účtu pre deploy. |
| **DATABASE_URL** | Supabase Dashboard | GitHub Secret | Infra Start | Pripojenie k DB pre `dbmate` (migrácie). |
| **DBMATE_MIGRATIONS_TABLE** | Odvodené (`APP_NAME`) | GitHub Workflow (Env) | Deployment | Názov tabuľky pre sledovanie migrácií v DB. |
| **SUPABASE_URL** | Supabase Dashboard | GitHub Secret | Infra Start | URL Supabase API (použité v Cloud Run env). |
| **SUPABASE_SERVICE_ROLE_KEY** | Supabase Dashboard | GitHub Secret | Infra Start | Admin kľúč pre bypass RLS na serveri. |
| **NEXT_PUBLIC_SUPABASE_URL** | Supabase Dashboard | GitHub Secret | Infra Start | Identické ako SUPABASE_URL, ale pre build klienta. |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY**| Supabase Dashboard | GitHub Secret | Infra Start | Verejný kľúč pre klienta aj server. |
| **NEXT_PUBLIC_API_URL** | Cloud Run (Url) | GitHub Variable | Infra Start | URL adresa backendu pre frontend klienta. |
| **OPENAI_API_KEY** | Používateľ (CLI) | GCP Secret Manager | Infra Start | Kľúč pre AI služby (server ho číta priamo z GCP). |
| **GITHUB_SHA** | GitHub Context | Docker Tag / Image | Deployment | Unikátny identifikátor verzie obrazu. |
| **FEEDBACK_GITHUB_TOKEN** | Manuálne (GitHub) | GitHub Secret | Deployment | Token pre zápis feedbacku do GitHub Issues. |
| **FEEDBACK_ENABLED** | GitHub Variable | Cloud Run Env | Deployment | Prepínač (true/false) pre feedback modul. |
| **GITHUB_OWNER** | GitHub Context | Cloud Run Env | Deployment | Vlastník repozitára (použité pre feedback). |
| **GITHUB_REPO** | GitHub Context | Cloud Run Env | Deployment | Názov repozitára (použité pre feedback). |
| **APP_ENV** | GitHub Context (Logic) | Cloud Run Env | Deployment | Rozlíšenie prostredia (`prod` vs `tst`). |
| **NODE_ENV** | Hardcoded (Workflow) | Cloud Run Env | Deployment | Nastavené na `production` pre optimalizáciu. |
| **ServiceName (Client/Server)** | Odvodené (`APP_NAME`) | GitHub Workflow (Env) | Deployment | Finálny názov služby v Cloud Run. |
| **DBMATE_MIGRATIONS_DIR** | Hardcoded (Workflow)| GitHub Workflow (Env) | Deployment | Cesta k SQL súborom (`db/migrations`). |

---

## 2. Zoznam komponentov v kontexte dátového toku

Nižšie sú uvedené komponenty, ktoré figurujú v matici ako zdroj alebo cieľ údajov:

### Infraštruktúrne komponenty (Zdroj/Cieľ pri inicializácii)

*   **Používateľ (CLI)**: Vstupný bod. Cez interaktívne menu v termináli definuje základné parametre prostredia (názov aplikácie, región, API kľúče).
*   **GCP (Google Cloud Platform)**:
    *   **Vygenerované identity (SA/WIF)**: GCP generuje unikátne identifikátory pre servisný účet a Workload Identity Federation, ktoré sa prenášajú do GitHubu pre autorizáciu.
    *   **GCP Secret Manager**: Cieľ pre najcitlivejšie údaje (napr. OpenAI kľúč), ktoré nie sú uložené v repozitári ani v GitHub Secrets, ale aplikácia k nim pristupuje priamo v cloudovom runtime.
    *   **Cloud Run (Placeholder)**: Dočasne nasadená služba, ktorej úlohou je poskytnúť finálnu URL adresu ešte predtým, než prebehne prvý reálny deployment klienta.
*   **Supabase Dashboard**: Externý zdroj kľúčov a pripojovacích reťazcov potrebných pre beh databázy a autentifikáciu.

### Deployment komponenty (Zdroj/Cieľ pri nasadzovaní)

*   **GitHub Variables/Secrets**: Úložisko v rámci repozitára. Premenné sú verejné (v rámci tímu), secrety sú šifrované. Slúžia ako primárny zdroj dát pre CI/CD workflowy.
*   **GitHub Actions (Workflow)**: Procesor dát. Číta tajomstvá z GitHubu a distribuuje ich ďalej (buď ich pichá do Docker buildu alebo nastavuje ako environment premenné v GCP).
*   **Docker Build (Arg/Tag)**: Moment transformácie, kedy sa statické dáta (ako URL adresy) stávajú súčasťou nezmeniteľného obrazu aplikácie (najmä pri Next.js kliente).
*   **Cloud Run (Runtime Env)**: Finálny cieľ. Tu sa premenné prostredia stávajú živými a aplikácia ich číta cez `process.env` počas svojho behu.
