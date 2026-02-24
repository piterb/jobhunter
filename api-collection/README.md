# JobHunter API Collection (Bruno)

Táto kolekcia obsahuje všetky API endpointy pre JobHunter aplikáciu.

## 🚀 Ako začať

### 1. Nainštaluj Bruno

Stiahni Bruno z [https://www.usebruno.com/downloads](https://www.usebruno.com/downloads)

### 2. Otvor kolekciu

1. Spusti Bruno
2. Klikni na **Open Collection**
3. Vyber priečinok `api-collection`

### 3. Nastav environment

1. V Bruno, vľavo hore, vyber environment **"Local"**
2. Token je už nastavený v `environments/Local.bru`

#### Ak potrebuješ token znova získať:

1. Spusti backend v development móde (`NODE_ENV=development`)
2. Spusť request `01_Auth/Login (Dev Token)`
3. Request automaticky uloží `access_token` do `authToken` premennej

### 4. Spusti server

Uisti sa, že backend server beží:

```bash
cd server
npm run dev
```

## 📁 Štruktúra kolekcie

```
api-collection/
├── JobHunter/
│   ├── Health/
│   │   └── Health Check.bru
│   ├── Jobs/
│   │   ├── List All Jobs.bru
│   │   ├── Create Job.bru
│   │   ├── Get Job by ID.bru
│   │   ├── Update Job.bru
│   │   └── Delete Job.bru
│   ├── Profile/
│   ├── Settings/
│   ├── Activities/
│   └── AI/
├── collection.bru
└── bruno.json
```

## 🔧 Premenné prostredia

V `collection.bru` sú definované tieto premenné:

- `baseUrl`: `http://localhost:3001/api/v1`
- `authToken`: Tvoj development auth token (`/auth/dev-login`)

Môžeš ich použiť v requestoch ako `{{baseUrl}}` a `{{authToken}}`.

## 📝 Príklady použitia

### 1. Health Check
Najprv otestuj, či server beží:
- Otvor `Health/Health Check.bru`
- Klikni **Send**
- Mal by si dostať `200 OK`

### 2. Vytvorenie práce
- Otvor `Jobs/Create Job.bru`
- Uprav JSON body podľa potreby
- Klikni **Send**
- Skopíruj `id` z odpovede

### 3. Zoznam prác
- Otvor `Jobs/List All Jobs.bru`
- Klikni **Send**
- Mal by si vidieť pole všetkých prác

### 4. Detail práce
- Otvor `Jobs/Get Job by ID.bru`
- Nahraď `:jobId` v URL skutočným ID
- Klikni **Send**

## 🎯 Tipy

1. **Použij testy** - Každý request má automatické testy, ktoré sa spustia po odpovedi
2. **Dokumentácia** - Každý request má záložku **Docs** s popisom
3. **Query parametre** - V requestoch s `~` sú voliteľné parametre (odkomentuj ich odstránením `~`)
4. **Path parametre** - Nahraď `:jobId` a podobné placeholdery skutočnými hodnotami

## 🔐 Bezpečnosť

**NIKDY necommituj skutočné auth tokeny do gitu!**

Bruno kolekcia je v gite, ale `authToken` je placeholder. Každý vývojár si musí nastaviť vlastný token lokálne.

## 📚 Ďalšie zdroje

- [Bruno dokumentácia](https://docs.usebruno.com/)
- [JobHunter API špecifikácia](../docs/api_spec.md)
- [Server README](../server/README.md)
