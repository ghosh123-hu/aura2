# Aura

Aura is a personal productivity app for planning tasks, tracking focus sessions and understanding how you spend your time. Its interface uses a warm off-white background, white cards and muted pastel accents.

## Features

- **Dashboard:** Today's tasks with quick completion, editing, rescheduling and quick add; a navigable monthly calendar; planned versus tracked time; a 365-day contribution heatmap; and a weekly summary.
- **Tasks and calendar:** Create and organize tasks by date, time, priority and category. The task editor keeps start time, end time and estimated duration in sync.
- **Focus Mode:** Start 25/5, 50/10 or custom focus sessions, link a task, pause or resume, and save actual session time. Completed sessions include a short break reminder.
- **Time Audit:** Log activities by category, use a timer, review daily, weekly and monthly time breakdowns, compare planned and actual time, and edit or delete entries.
- **Habits and trackers:** Track routines and personal goals over time.
- **Analytics and settings:** Review summaries based on recorded activity, update preferences, and manage local data.
- **Persistent local storage:** Tasks, focus sessions, time entries and settings are saved in the browser on this device. Aura does not include a remote account or cross-device sync backend.

Aura starts with an empty workspace and does not seed demo activity.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Tech stack

- React 18 and TypeScript
- Vite
- Tailwind CSS
- date-fns
- Recharts
- Lucide React
- Browser `localStorage` for persistence
