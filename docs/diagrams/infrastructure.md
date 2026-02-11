# 🏗️ Infrastructure: Manual vs. Automated (IaC)

Tento diagram znázorňuje rozdelenie zodpovedností pri nastavovaní prostredia. Cieľom je maximalizovať automatizáciu (IaC), zatiaľ čo kritické bezpečnostné a platformové kroky zostávajú pod manuálnou kontrolou.

```mermaid
graph TB
    %% Definícia štýlov
    classDef manual fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100;
    classDef auto fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#2e7d32;
    classDef secret fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#c2185b;

    subgraph Phase1 ["1. Manuálny Setup (One-time)"]
        direction TB
        S1["Vytvorenie Supabase projektu"]:::manual
        G1["Google Cloud: OAuth Consent & Credentials"]:::manual
        O1["OpenAI: API Key Generation"]:::manual
        H1["Vercel/Railway: Inicializácia projektu"]:::manual
    end

    subgraph Phase2 ["2. Konfigurácia & Secrets"]
        direction TB
        E1["Nastavenie Env Variables v GitHub Secrets"]:::secret
        R1["Redirect URLs v Google Console"]:::manual
    end

    subgraph Phase3 ["3. Automatizácia & IaC (Priebežne)"]
        direction TB
        M1["Supabase Migrations (Schemas, Indexes)"]:::auto
        RLS["RLS Policies & Roles"]:::auto
        CD["CI/CD Deployment (FE + BE Code)"]:::auto
        SH["Shared Types & Interfaces"]:::auto
    end

    %% Prepojenia
    Phase1 --> Phase2
    Phase2 --> Phase3

    %% Popisky
    note1["Manuálne kroky: Vyžadujú prístup do konzoly služieb."]
    note2["Automatizované (IaC): Bežia pri každom pushi do gitu."]

```

### Podrobný rozpis

| Komponent | Typ | Čo konkrétne? |
| :--- | :--- | :--- |
| **Infraštruktúra** | **Manuálne** | Založenie účtov, vytvorenie projektov v cloude, pridanie platobnej karty. |
| **Databáza** | **IaC** | Definícia tabuliek (`jobs`, `activities`), migračné skripty v repozitári. |
| **Bezpečnosť (RLS)** | **IaC** | Pravidlá pre prístup k dátam definované v SQL skriptoch. |
| **Auth** | **Hybrid** | **Manuálne:** Setup v Google/Supabase. **IaC:** Implementácia v kóde. |
| **API Kľúče** | **Manuálne** | Vygenerovanie a bezpečné uloženie do environment premenných. |
| **Deployment** | **IaC** | GitHub Actions automaticky buildne a nasadí FE aj BE. |
