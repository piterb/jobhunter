# Infra & Modularita: Návrh Riešenia

Tento dokument stručne popisuje plán na vyriešenie "bordelu" v infraštruktúre a zníženie komplexity aplikácie.

## 1. Izolácia Infraštruktúry (Infra-as-a-Tool)
*   **Problém**: `infrastart` je súčasťou repozitára a mieša sa s app kódom.
*   **Riešenie**: Vyčleniť `infrastart` do samostatného priečinka `infra/` (alebo vlastného repo) s vlastným `package.json`. Appka ho bude brať ako nástroj, nie ako súčasť logic.

## 2. Dynamický Manažment Premenných (Manifest-Driven)
*   **Problém**: Ručné pridávanie GH secrets pri každej novej funkcii (napr. feedback).
*   **Riešenie**: Každý balík (client, server, feedback) bude mať súbor `devops.json` so zoznamom premenných.
    ```json
    { "required_secrets": ["FEEDBACK_BUCKET"], "required_vars": ["API_URL"] }
    ```
*   **Automatizácia**: `infrastart` prelezie všetky balíky, zosumarizuje požiadavky a **automaticky ich vytvorí v GitHub Environment** (ak chýbajú, vypýta si ich od teba len raz).

## 3. Modulárny Feedback (Standalone Balík)
*   **Problém**: Feedback je napevno v `server` a `client`.
*   **Riešenie**: Presun kód do `packages/feedback`.
    *   **Export**: Balík bude exportovať React komponent pre frontend a Middleware/Service pre backend.
    *   **Reusabilita**: V novom projekte stačí spraviť `npm install @jobhunter/feedback` a pridať jeden riadok do servera a frontendu.

## 4. Zjednotenie s Deploymentom
*   **Problém**: Rozpor medzi tým, čo robí `infrastart` a čo robia GH workflows.
*   **Riešenie**: `infrastart` prestane byť len "setup" skriptom. Bude slúžiť ako "Lifecycle Manager", ktorý vie:
    1.  Provisioning (WIF, IAM).
    2.  Sync premenných do GH.
    3.  Validácia prostredia pred nasadením.

---

### Prompt na akciu:
Chceš začať s **bodom 3 (vyčlenenie Feedbacku)** alebo **bodom 1+2 (reštrukturalizácia infrastart a premenných)**?
