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
2.  **Configuration Wizard**: Prompt you for local settings (DB URL, OpenAI Key, etc.) and generate `.env.local` and `local.env`.
3.  **Install Dependencies**: Run `npm install` across the monorepo.
4.  **Database Migration**: Run the initial schema setup.
5.  **Seed Data**: Create a default developer profile and sample job applications.

---

## 🔑 Authentication (Local Development)

In local development, we use a **Mock Authentication Bypass**:
1.  Go to `http://localhost:3000/login`.
2.  Click **"Sign in as Developer"**.
3.  You will be logged in as `dev@jobhunter.local` with full access.

---

## �️ Operational Commands

### Infrastructure (Docker)

| Command | Description |
| :--- | :--- |
| `docker-compose up -d` | Start infrastructure in background |
| `docker-compose down` | Stop and remove infrastructure containers |
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
| `npm run dev` | Start both client and server in watch mode |
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

## � Troubleshooting (Mac Specific)

### Permission Errors (`EPERM`)
MacOS sometimes blocks Node.js from reading files starting with a dot (like `.env.local`). 
- **Solution**: The backend uses `local.env` as a fallback. The `npm run setup` command automatically creates both.
- If the server fails to load DB URL, ensure `server/local.env` exists.

### Temporary File Errors (`tsx`)
If you see errors related to `tsx` or `ts-node-dev` not finding temporary files:
- The scripts are configured to use a local `./.tmp` folder. Ensure this folder is writable.

### Image/Avatar not loading
If avatars upload successfully but show as broken icons:
- Ensure `localhost:4443` is allowed in your browser (check if you can open the image URL directly).
- Ensure Docker was restarted after adding the `-cors "*"` flag to `docker-compose.yml`.
