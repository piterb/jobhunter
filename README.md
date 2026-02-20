# 🛠️ JobHunter Development Setup

This guide will help you set up the JobHunter development environment on your local machine.

## Prerequisites

- **Node.js**: v18 or later
- **Docker**: Docker Desktop (required for database and storage emulation)
- **NPM**: standard package manager

## 🚀 One-Step Setup

The project includes a comprehensive setup script that handles infrastructure, environment variables, migrations, and seeding.

```bash
npm run setup
```

This script will:
1.  **Start Docker containers**: Postgres (DB) and Fake-GCS (Storage).
2.  **Configuration Wizard**: Reads `server/.env.example` and `client/.env.example`, prompts values, then generates `server/.env.local` and `client/.env.local`.
3.  **Install Dependencies**: Run `npm install` across the monorepo.
4.  **Database Migration**: Run the initial schema setup.
5.  **Seed Data**: Create a default developer profile and sample job applications.

## Manual Env Setup (Optional)

If you do not want to run the wizard, copy and fill these templates manually:

- `server/.env.example` -> `server/.env.local`
- `client/.env.example` -> `client/.env.local`

For local startup these two are enough.

---

## 🔑 Authentication (Local Development)

Use env files as the single source of truth:

1. `server/.env.example` (copy to `server/.env.local`)
2. `client/.env.example` (copy to `client/.env.local`)

Both files include inline auth mode guidance (`dev` vs `keycloak`) and comments describing where each value comes from in Keycloak UI.

After any `.env` change, restart both server and client dev processes.

---

## �️ Operational Commands

### Infrastructure (Docker)

| Command | Description |
| :--- | :--- |
| `docker-compose up -d` | Start infrastructure in background |
| `docker-compose down` | Stop and remove infrastructure containers |
| `docker-compose down -v --remove-orphans` | Full wipe: remove containers, volumes, and orphaned services |
| `docker-compose restart` | Restart infrastructure (useful for config changes) |
| `docker-compose logs -f` | Follow all infrastructure logs |
| `docker logs jobhunter-fake-gcs` | View storage emulator logs |
| `docker logs jobhunter-db` | View Postgres database logs |

### Data Management

| Command | Description |
| :--- | :--- |
| `npm run migrate` | Apply new SQL migrations from `db/migrations` |
| `npm run seed` | Clear and re-populate DB with sample data |
| `rm -rf storage-data/*` | Physically wipe all uploaded files/avatars |

### Application

| Command | Description |
| :--- | :--- |
| `npm run dev -w server` | Start backend API (watch mode) |
| `npm run dev -w client` | Start frontend app (watch mode) |
| `npm run setup` | Run the full setup flow (Docker + Env + Migrations + Seed) |

---

## 📂 Project Structure

- `client/`: Next.js frontend application.
- `server/`: Express.js backend API.
- `shared/`: Shared TypeScript types and Zod schemas.
- `db/migrations/`: SQL migration files.
- `storage-data/`: Local physical storage for uploads (GCS Emulator).

---

## 📦 Local Services

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:3000` | Main application UI |
| **Backend API** | `http://localhost:3001` | Express API server |
| **Postgres** | `localhost:5432` | Database (User: `jobhunter`, Pass: `jobhunter`) |
| **GCS Emulator** | `http://localhost:4443` | File storage (Avatars, Documents) |

---

## ✅ Testing

### Unit Tests (Server)

```bash
# From project root
npm run test:run -w server

# Watch mode
npm test -w server
```

### API Tests (Bruno)

1. Open the `api-collection` folder in Bruno.
2. Make sure backend is running (`npm run dev -w server`).
3. Run `JobHunter / 01_Auth / Login (Dev Token)` to set `authToken`.
4. Run any protected request (Jobs, Profile, Settings, etc.).
5. For feedback endpoint, run `JobHunter / Feedback`.

Collection docs: `api-collection/README.md`

---

## � Troubleshooting (Mac Specific)

### Permission Errors (`EPERM`)
If you hit permission issues during local setup, make sure Docker and your project directory are writable for your user.

### Temporary File Errors (`tsx`)
If you see errors related to `tsx` or `ts-node-dev` not finding temporary files:
- The scripts are configured to use a local `./.tmp` folder. Ensure this folder is writable.

### Image/Avatar not loading
If avatars upload successfully but show as broken icons:
- Ensure `localhost:4443` is allowed in your browser (check if you can open the image URL directly).
- Ensure Docker was restarted after adding the `-cors "*"` flag to `docker-compose.yml`.
