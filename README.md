# 🎯 JobHunter

An intelligent job application tracking system with AI-powered parsing and automated history tracking.

## 📚 Documentation for Agents & Developers
All technical specifications and design documents are located in the `docs/` folder. Please read them before starting any work.

- **[Technical Specification](docs/spec.md)** - Architecture, Data Model, API Logic.
- **[Design System](docs/design_system.md)** - UI Colors, Typography, Component definitions.
- **[UI Design](docs/ui_design.md)** - Wireframes, Layouts, Mockups.

## 🏗️ Project Structure (Monorepo)
- **`/client`**: Frontend application (Next.js App Router).
- **`/server`**: Backend API & Logic (Express.js).
- **`/shared`**: Shared TypeScript types/interfaces.

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Supabase Project (for DB & Auth)
- OpenAI API Key

### Installation
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start development server:
    ```bash
    npm run dev
    ```
    This will start both Client (port 3000) and Server (port 3001).

## 🔒 Environment Variables
Copy `.env.example` to `.env` in both client and server directories and fill in your keys.
