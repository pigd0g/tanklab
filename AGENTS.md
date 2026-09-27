# AGENTS.md

## What this is

Single-package React 19 + Vite 8 SPA. Local-first aquarium tracker — **no backend**; all data lives in browser localStorage (key `tanklab.v1`). Mobile-first target (Android Chrome). No tests, no CI.

## Commands

- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build`; this doubles as the typecheck (no separate typecheck script exists)
- `npm run lint` — **oxlint**, not ESLint (config: `.oxlintrc.json`). Don't add ESLint config or rules.
- `npm run preview` — serve `dist/`
- Verification = `npm run lint` + `npm run build`. There is no test framework; don't invent one.

## Architecture

- `src/main.tsx` — entry. Uses `HashRouter`: all routing is hash-based, so static deploys need no server config (see `Dockerfile` + `nginx.conf`).
- `src/types.ts` — all data shapes (`AppData` = tanks + entries + settings)
- `src/lib/storage.ts` — localStorage persistence; `migrate()` validates/filters everything on load and import. Schema changes must keep export/import JSON working.
- `src/lib/store.tsx` — single React context store (`useStore`); all mutations go through it and auto-save on every change
- `src/lib/derive.ts` — derived stats: tank status, trends, free NH₃ (Emerson equation)
- `src/screens/` — pages wired in `src/App.tsx` (Dashboard, TankDetail, Settings; TankForm is a modal)

## Product notes

- Tanks added to the app may already be **established/cycled** — the user is often adopting a running tank, not starting a new one. Never force new-tank assumptions (cycling stage, 2-day test reminders, "New tank" watch status) on a tank just because it was just added to the app; being new to TankLab ≠ new to the fishkeeper. Tanks have an `established` flag (set in the add/edit form) that suppresses all new-tank behavior.
- **Fishless cycle mode** (`src/lib/cycleGuide.ts` + `src/screens/Cycle.tsx`): method distilled from fishlab.com. Day 1 = the day ammonia was first added. Ammonia dosing is logged as a `maintenance` entry with type `ammoniaDose`; checklist ticks are *derived* from entries, never stored. Cycle state lives on `Tank.cycling` (`startedAt`/`dosePpm`/`completedAt`); dosing continues after `completedAt` via normal logging. Phases move forward only and require nitrate evidence before "confirm".
- **Maintenance schedules** (`Tank.maintenanceSchedule`): per-task intervals; last-done is derived from logged maintenance entries (nothing extra stored). Homepage "Needs attention" = water change + water test + schedule items + cycle tasks, per action (feeding deliberately excluded).

## Gotchas

- tsconfig is strict in unusual ways: `verbatimModuleSyntax` (types must use `import type`), `noUnusedLocals`/`noUnusedParameters` (build fails on unused vars), `erasableSyntaxOnly` (no enums, namespaces, or parameter properties).
- Demo data: opening the app with `#demo` in the URL seeds two demo tanks — only works while storage is empty (logic in `src/main.tsx`).
- localStorage quota is real: tank photos are auto-resized to ~720px JPEG because the whole dataset is serialized to one localStorage key. Don't add unbounded data.