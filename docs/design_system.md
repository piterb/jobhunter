# 🎨 JobHunter - Design System & UI Specification

> **Purpose:** Source of truth for all UI implementation. Use these tokens and patterns to maintain consistency across the application.

## 1. Core Tokens (Tailwind CSS)

### 1.1 Colors
**Theme:** Dark Mode Only (`class="dark"`).

| Semantic Role | Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `bg-slate-950` | `#020617` | Main app background |
| **Surface Primary** | `bg-slate-900` | `#0f172a` | Cards, Sidebar, Panels |
| **Surface Secondary**| `bg-slate-800` | `#1e293b` | Borders, Separators, Inputs |
| **Primary Brand** | `indigo-600` | `#4f46e5` | Primary Buttons, Active States |
| **Primary Hover** | `indigo-500` | `#6366f1` | Hover state for primary |
| **Text Primary** | `text-slate-50` | `#f8fafc` | Headings, Main Data |
| **Text Secondary** | `text-slate-400` | `#94a3b8` | Metadata, Labels, Descriptions |
| **Danger** | `red-500` | `#ef4444` | Delete actions, Error states |

### 1.2 Typography
**Font:** Inter (or system sans-serif).

| Style | Classes | Usage |
| :--- | :--- | :--- |
| **H1 (Page Title)** | `text-2xl font-semibold tracking-tight text-white` | Dashboard Header |
| **H2 (Section)** | `text-lg font-medium text-white` | Panel Titles |
| **Body Prominent**| `text-sm font-medium text-slate-200` | Table Cell (Main) |
| **Body Default** | `text-sm text-slate-400` | Table Cell (Secondary), Paragraphs |
| **Caption** | `text-xs text-slate-500` | Timestamps, Footers |

## 2. Component Specifications

### 2.1 Buttons
- **Primary:** `bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm`
- **Secondary:** `bg-white/10 hover:bg-white/20 text-white`
- **Ghost:** `hover:bg-slate-800 text-slate-400 hover:text-white`
- **Size:** `h-9 px-4 py-2` (Standard), `h-8 px-3 text-xs` (Small)

### 2.2 Status Badges (Job Status)
**Shape:** Rectangular with rounded corners (`rounded-md`).
**Size:** Fixed width (`w-24` or `w-28`), centered text (`justify-center`).

| Status | Style Classes |
| :--- | :--- |
| **Applied** | `bg-blue-500/15 text-blue-400 border border-blue-500/20` |
| **Interview** | `bg-amber-500/15 text-amber-400 border border-amber-500/20` |
| **Offer** | `bg-emerald-500/15 text-emerald-400 border border-emerald-500/20` |
| **Rejected** | `bg-red-500/15 text-red-400 border border-red-500/20` |
| **Draft** | `bg-slate-700/50 text-slate-400 border border-slate-700` |

### 2.3 Input Fields
- **Base:** `bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md`
- **Placeholder:** `text-slate-600`

## 3. Layout Patterns

### 3.1 Main Layout (2-Column)
1.  **Header (`h-16`):** Fixed top, Border-bottom. Contains Logo, "Quick Add" input, and User Profile (with Menu).
2.  **Content Area:** Main scrollable area containing the Job Table.
3.  **Detail Panel (`w-[400px]`):** Slide-over or persistent right column. Border-left.
**Note:** Sidebar removed. Navigation is in the top-right menu.

### 3.2 Data Table (Jobs)
- **Library:** TanStack Table (React Table).
- **Header:**
    - `text-xs font-semibold uppercase text-slate-500`
    - **Sortable:** Clickable headers with ↑↓ icons (Lucide `ArrowUpDown`).
- **Row:** `border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors`.
- **Pagination:**
    - Sticky footer or below table.
    - "Page 1 of X" + [Previous] [Next] buttons.
    - Default page size: 10 or 20 rows.

### 3.3 Detail Panel & Timeline
**Structure:**
- **Header:** Job Title (Large), Company (Sub), Status Badge (Editable).
- **Tabs:** [Info] [Timeline] [Notes]
- **Timeline View:**
    - Vertical line (`border-l border-slate-800`) connecting items.
    - **Items:**
        - **Icon:** Circle w/ Lucide icon (Mail, Calendar, FileText) on the line.
        - **Content:** Card with "Date" (right), "Title" (bold), "Snippet" (gray).
        - **Spacing:** `gap-6` between events.

## 4. Iconography (Lucide React)
- **Navigation:** `LayoutDashboard`, `BarChart3` (Analytics), `Settings`.
- **Actions:** `Plus` (Add), `Search`, `MoreHorizontal` (Row Actions), `X` (Close).
- **Timeline:** `Mail` (Email), `Calendar` (Meeting), `CheckCircle2` (Status Change).
