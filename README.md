# TankLab 🐠

Local-first aquarium tracking, built with React + Vite. All data stays in your browser's
localStorage — no accounts, no cloud. Optimized for mobile (Android Chrome).

## Features

- Multiple tanks, each with photo (auto-resized to ~720px JPEG), volume, setup date, source water
- Water tests — log only what you measured (ammonia NH₃/NH₄⁺, nitrite, nitrate, phosphate, pH, water/room temp)
- Water changes, maintenance, feeding and livestock logs with date & time captured automatically
- Tank status (Good / Watch / Action needed), trends per metric, and nitrogen-cycle progress
- Estimated free NH₃ from total ammonia + pH + temperature (Emerson equation)
- Weekly water-change and testing reminders (in-app), feeding plan
- Charts (ECharts): toxins, nitrate & phosphate, pH & temperature across 7/30/90 days or all
- Export/import JSON backups in Settings (merge or replace), metric ⇄ imperial units

## Dev

    npm install
    npm run dev      # local dev server
    npm run build    # production build
    npm run preview  # serve the build

Tip: open the app with `#demo` in the URL to seed two demo tanks (only works while storage is
empty) — handy for trying the UI before adding real data.

## Deploy

Build and host `dist/` anywhere static (GitHub Pages, Netlify). The app uses hash routing, so no
server config is needed.
