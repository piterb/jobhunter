# 🎯 JobHunter

An intelligent job application tracking system with AI-powered parsing and automated history tracking.

## 📚 Documentation for Agents & Developers
All technical specifications and design documents are located in the `docs/` folder. Please read them before starting any work.

- **[Technical Specification](docs/spec.md)** - Architecture, Data Model, API Logic.
- **[Infrastructure & Setup](docs/diagrams/infrastructure.md)** - Manual vs. Automated (IaC) processes.
- **[Design System](docs/design_system.md)** - UI Colors, Typography, Component definitions.
- **[UI Design](docs/ui_design.md)** - Wireframes, Layouts, Mockups.

## 🏗️ Project Structure (Monorepo)
- **`/client`**: Frontend application (Next.js App Router).
- **`/server`**: Backend API & Logic (Express.js).
- **`/shared`**: Shared TypeScript types/interfaces.

## 🚀 Local Development (Quick Start)

The fastest way to get the project running locally:

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18+)
- **Docker Desktop** (required for local Supabase)
- **Supabase CLI** (`brew install supabase/tap/supabase` on macOS)

### 2. Automated Setup
This command installs dependencies, starts local Supabase (Docker), and generates `.env` files.
```bash
npm run setup
```

### 3. AI Configuration
In `server/.env`, fill in your `OPENAI_API_KEY`. If not provided, the app will run, but AI features will be disabled.

### 4. Run the Application
```bash
npm run dev
```
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:3001](http://localhost:3001)
- **Supabase Dashboard (Local):** [http://localhost:54323](http://localhost:54323)

## 🏗️ Project Structure (Monorepo)
- **`/client`**: Frontend (Next.js App Router).
- **`/server`**: Backend API (Express.js).
- **`/shared`**: Shared TypeScript types and interfaces.
- **`/supabase`**: Database configuration, migrations, and seed data.
- **`/docs`**: Complete project documentation.

## 🛠️ Useful Commands
- `npm run setup` - Initial environment setup.
- `npm run dev` - Start both FE and BE simultaneously.
- `npm run supabase:status` - View local access credentials and URLs.
- `npm run supabase:stop` - Stop local Docker containers.

