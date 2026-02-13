# Architecture Diagram

This diagram represents the high-level architecture of the JobHunter application, showing the relationships between the frontend, backend, database, and external integrations.


## 1. Hybridná Architektúra
JobHunter využíva **hybridný model**, ktorý kombinuje výhody Serverless DB (Supabase) a vlastného logického enginu (Express.js).

### Komponenty:
- **Frontend (Next.js)**: Hlavné rozhranie, ktoré priamo komunikuje so Supabase pre dáta (CRUD).
- **Supabase**: Zabezpečuje Autentifikáciu, Databázu s RLS (Row Level Security) a Storage pre súbory.
- **Backend (Express.js)**: Slúži ako **AI & Logic Engine**. Rieši úlohy, ktoré vyžadujú serverovú orchestráciu, scraping alebo bezpečnú prácu s AI API kľúčmi.

(Pozri diagram v: [docs/diagrams/architecture.md](./diagrams/architecture.md))

## 2. Infraštruktúra & Automatizácia
Pre prehľadnosť sme rozdelili nastavenie projektu na **manuálne kroky** (nastavenie platforiem) a **automatizované kroky** (Infraštruktúra ako kód - IaC).

Podrobný rozpis a diagram nájdeš tu:
👉 **[Infrastructure: Manual vs. Automated (IaC)](./diagrams/infrastructure.md)**
