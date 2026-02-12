# 🔐 Autentifikácia (Google OAuth Setup)

Tento dokument popisuje, ako manuálne nastaviť Google Auth pre lokálne vývojové prostredie JobHunter.

## 1. Google Cloud Console

1.  Choď na **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  Vytvor nový projekt (alebo vyber existujúci).
3.  V menu choď na **APIs & Services > OAuth consent screen**:
    *   Klikni na **Get Started**.
    *   V kroku **Branding** vyplň `App name` (napr. JobHunter) a vyber svoj e-mail.
    *   V kroku **Audience** vyber typ **External**.
    *   V kroku **Contact Info** zadaj svoj e-mail a dokonči proces.
4.  V menu choď na **APIs & Services > Credentials**:
    *   Klikni na **Create Credentials > OAuth client ID**.
    *   Vyber Application type: **Web application**.
    *   Do **Authorized redirect URIs** pridaj túto adresu (pre lokálny Cli):
        `http://localhost:54321/auth/v1/callback`
    *   Po kliknutí na **Create** si skopíruj **Client ID** a **Client Secret**.

## 2. Supabase Konfigurácia

Pri lokálnom vývoji cez Supabase CLI je najlepšie nastaviť Google Auth priamo v konfiguračnom súbore projektu.

1.  Otvor súbor `supabase/config.toml`.
2.  Do sekcie `[auth.external.google]` doplň svoje údaje:

```toml
[auth.external.google]
enabled = true
client_id = "TVOJE_CLIENT_ID"
secret = "TVOJ_CLIENT_SECRET"
redirect_uri = "http://localhost:54321/auth/v1/callback"
skip_nonce_check = true
```

3.  Povoľ lokálne redirecty v sekcii `[auth]`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```

## 3. Aktivácia zmien

Po každej zmene v `config.toml` je potrebné reštartovať Supabase stack:

```bash
npx supabase stop && npx supabase start
```

## 4. Testovanie

1.  Spusti frontend (`npm run dev` v priečinku `client`).
2.  Choď na `http://localhost:3000`.
3.  Po kliknutí na **Sign in with Google** by si mal byť presmerovaný na výber Google účtu a následne späť do aplikácie.
