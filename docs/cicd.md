# Environments & CI/CD

Tento dokument popisuje nastavenie vývojových prostredí, proces testovania a automatizovaného nasadzovania (CI/CD).

## 1. Diagram Toku (Dev to Prod)

(Pozri diagram v: [docs/diagrams/environments_cicd.mermaid](./diagrams/environments_cicd.mermaid))

```mermaid
graph TD
    %% Obsah je v súbore docs/diagrams/environments_cicd.mermaid
```

## 2. Nastavenie Prostredí

| Prostredie | Účel | Hosting | Databáza |
| :--- | :--- | :--- | :--- |
| **Local (Dev)** | Vývoj nových funkcií | `localhost:3000` | Local Supabase (Docker) |
| **Staging (Test)** | Preview PR a testovanie pred nasadením | Vercel Preview | Supabase Staging Project |
| **Production** | Živá aplikácia pre používateľov | Vercel (FE) + Railway (BE) | Supabase Production Project |

## 3. Testovacia Stratégia

### 3.1 Unit Testy (Vitest)
- **Kde:** `shared/` a server logiky.
- **Spustenie:** `npm run test`
- **Cieľ:** Overenie správnosti parsovania dát z AI a biznis logiky bez závislosti na DB.

### 3.2 Integračné Testy
- **Cieľ:** Overenie prepojenia FE -> BE -> Supabase.
- **Nástroj:** Playwright (E2E) v Staging prostredí.

## 4. CI/CD Proces (GitHub Actions)

1.  **Vytvorenie Pull Requestu:** Spustí sa pipeline (Install -> Lint -> Build -> Test).
2.  **Merge do `main`:** Automatický deploy na Staging/Preview prostredie.
3.  **Release (Tag):** Manuálne schválené nasadenie do Produkcie.
