# 📋 JobHunter - Task Breakdown & Status

This document tracks the progress of the JobHunter application development. It is shared across all agents to ensure context continuity.

## 🚀 Phase 1: Project Scoping & Design (Current Phase)
Focus on defining requirements, design system, and visual prototypes (mockups).

- [x] **Define MVP Specification** (`docs/spec.md`)
  - [x] Architecture & Tech Stack defined (Monorepo, Next.js, Express)
  - [x] Data Model (Jobs, Activities) defined
- [x] **Define Design System** (`docs/design_system.md`)
  - [x] Color Palette (Slate/Indigo)
  - [x] Typography & Layout Patterns
- [/] **Create UI Mockups (HTML/Tailwind)**
  - [x] Dashboard Main View (`docs/mockups/dashboard.html`)
  - [x] Settings: Profile (`docs/mockups/settings_profile.html`)
  - [x] Settings: Appearance (`docs/mockups/settings_appearance.html`)
  - [x] Settings: API Keys (`docs/mockups/settings_api_keys.html`)
  - [ ] **Login / Auth Screen** (Pending)
  - [ ] **Job Detail Full Screen** (Optional/Low Priority)

## 🛠 Phase 2: Technical Setup
Initialize the codebase and infrastructure.

- [ ] **Initialize Monorepo Structure**
  - [ ] Setup `npm` workspaces / `turbo`
  - [ ] Configure `shared`, `client`, `server` packages
- [ ] **Frontend Setup (Client)**
  - [ ] Initialize Next.js App Router project
  - [ ] Install Tailwind CSS & Lucide React
  - [ ] Implement base Layout (Header + Profile Menu)
- [ ] **Backend Setup (Server)**
  - [ ] Initialize Express.js project with TypeScript
  - [ ] Configure Environment Variables (`.env`)
- [ ] **Database Setup**
  - [ ] Setup Supabase project (Remote)
  - [ ] Create Definitions for `jobs` and `activities` tables

## 💻 Phase 3: Core Implementation
Building the functional features.

- [ ] **Authentication**
  - [ ] Implement Login Screen (UI)
  - [ ] Integrate Supabase Auth (Google OAuth)
  - [ ] Implement Auth Middleware on Backend
- [ ] **Dashboard & Job Management**
  - [ ] Implement Job Table (Fetch from API)
  - [ ] Implement "Add Job" Modal/Input
  - [ ] Implement Job Status Updates (Drag & Drop or Dropdown)
- [ ] **Job Details & Timeline**
  - [ ] Implement Detail Panel (Right Sidebar)
  - [ ] Display Activity Feed (Job History)
  - [ ] Add Manual Notes Feature

## 🧠 Phase 4: AI & Advanced Features
Integrating Intelligence.

- [ ] **Smart Ingest (OpenAI)**
  - [ ] Backend Service to fetch URL HTML
  - [ ] OpenAI Prompt for parsing Job details
  - [ ] API Endpoint: `POST /ingest`
- [ ] **Smart Activity Tracking**
  - [ ] Email Parsing Logic (Regex/AI)
  - [ ] Ghosting Detection Logic (Konfigurovateľný threshold z profilu)

## ✨ Phase 5: Polish & Launch
Final touches before V1.

- [ ] **UI/UX Polish**
  - [ ] Loading States (Skeletons)
  - [ ] Error Handling (Toasts/Alerts)
  - [ ] Responsive Design Checks
- [ ] **Testing**
  - [ ] Manual End-to-End Testing
- [ ] **Documentation**
  - [ ] Setup Instructions
  - [ ] API Documentation
