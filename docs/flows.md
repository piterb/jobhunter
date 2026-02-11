# System Flows

This document contains sequence diagrams for key processes in JobHunter.

## 1. Smart Ingest (URL Processing)

This flow describes how a job posting URL is processed using AI to extract structured data.


(Pozri diagram v: [docs/diagrams/smart_ingest.mermaid](./diagrams/smart_ingest.mermaid))

```mermaid
sequenceDiagram
    %% Obsah je v súbore docs/diagrams/smart_ingest.mermaid
```

## 2. Smart Paste (Thread Analysis & Merge)

How AI cleans and extracts structured history from raw text pastes (e.g., Outlook threads).

### Proces:
1.  **Input**: Používateľ vloží surový text (Ctrl+V) do poľa aktivity.
2.  **AI Splitting**: Backend pošle text AI s inštrukciou rozdeliť ho na jednotlivé správy/udalosti.
3.  **Deduplikácia**: 
    - Pre každú správu sa vypočíta klientsky alebo serverový `checksum` (hash jadra správy + dátum).
    - Systém skontroluje tabuľku `activities` pre daný `job_id` a existujúce checksumy.
4.  **UI Merge Preview**: 
    - Používateľ uvidí zoznam správ s označením: "Nová" vs "Už máte".
    - Možnosť vybrať/odznačiť, čo sa má reálne importovať.
5.  **Chronology**: Po uložení sa timeline v UI automaticky zoradí podľa `occurred_at` (nie podľa času vloženia).

(Pozri diagram v: [docs/diagrams/smart_paste.md](./diagrams/smart_paste.md))

```mermaid
sequenceDiagram
    %% Obsah je v súbore docs/diagrams/smart_paste.md
```


## 3. Ghosting Detection (Background/UI Logic)

This process identifies job applications with no communication for a longer period.

1.  **Check Interval**: The system (either on frontend render or via periodic check) compares `last_activity` with the current date.
2.  **Threshold**: Uses `ghosting_threshold_days` from the user's `profile`.
3.  **Action**:
    - If `delta > threshold` AND status is `Applied`:
        - UI: Highlight row with "Ghosting Alarm".
        - Backend (optional): Update status to `Ghosted` or send notification.
4.  **Reset**: Any new activity (Smart Paste email, manual note, status change) resets `last_activity`, clearing the alarm.

## 4. Cover Letter Generation

Detailed AI generation of a tailored cover letter based on job context and user profile.

(Pozri diagram v: [docs/diagrams/cover_letter_generation.md](./diagrams/cover_letter_generation.md))

```mermaid
sequenceDiagram
    %% Obsah je v súbore docs/diagrams/cover_letter_generation.md
```
