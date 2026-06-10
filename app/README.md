# Workout PWA — Plan, Track & Progress

A phone-first workout tracker, built as an installable Progressive Web App from the
design handoff in the parent folder. Import a training plan as JSON, run a workout
(Focus or Full-day), log sets with an auto-starting rest timer, manage an exercise
library, and track strength over time.

- **Frontend:** React 18 + TypeScript + Vite, installable PWA (manifest + Workbox service worker)
- **Backend:** Firebase — Anonymous Auth + Cloud Firestore with offline persistence
- **Styling:** the design tokens from `styles.css` ported verbatim (CSS custom properties)
- **Charts:** the prototype's hand-rolled SVG line/bar charts, kept as-is

It runs **with no backend at all** (local-only mode) out of the box, and upgrades to
cloud sync the moment you add Firebase config. See below.

---

## Quick start

```bash
cd app
npm install
npm run dev          # http://localhost:5173 — runs in local-only mode until you add Firebase config
```

Build & preview the production PWA:

```bash
npm run build
npm run preview
```

`npm run build` runs `tsc -b` (strict typecheck) then `vite build`, emitting `dist/`
with a precached service worker.

---

## Connect Firebase (cloud sync + accounts)

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method:** enable **Anonymous** (required). Optionally enable
   **Google** if you want the "Continue with Google" upgrade button.
3. **Firestore Database:** create a database (production mode is fine — the rules below lock
   it down per user).
4. **Project settings → Your apps → Web app:** register a web app and copy the config values.
5. Copy `.env.example` to `.env` and fill them in:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_ENABLE_GOOGLE_AUTH=1   # only if you enabled Google sign-in
   ```

6. Deploy the security rules in `firestore.rules`:

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   ```

Restart `npm run dev`. The app now signs each visitor in anonymously, stores their data at
`users/{uid}`, and syncs across devices. If they sign in with Google, the anonymous account
is **upgraded in place** so nothing is lost.

### Deploy hosting (optional)

```bash
npm run build
firebase deploy --only hosting
```

---

## How persistence works

All data access goes through one layer: `src/data/store.ts`. Screens never touch Firebase
directly — they read `state` and call `update(state => newState)`.

- **Firebase mode** (config present): the entire `AppState` is stored as a single document
  per user (`users/{uid}`). Firestore's `persistentLocalCache` gives offline-first reads and
  writes — log sets at the gym with no signal and they sync when you reconnect. Writes are
  debounced (400 ms) to batch rapid logging.
- **Local mode** (no config): the same `AppState` is persisted to `localStorage`. The app is
  fully usable; it just doesn't sync between devices.

The data model and calc helpers (`epley1RM`, `sessionVolume`, `best1RMOfSession`,
`bestSetOfSession`) are ported verbatim from the prototype's `seed.js` so any future
server agrees with the client. Plan-import validation lives in `src/lib/plan.ts` and is a
pure function, so it can be reused server-side (e.g. a Cloud Function) without changes.

### Want normalized collections instead of one document?

The single-document model keeps the offline + sync story simple and is plenty for a
personal app (well under Firestore's 1 MB/doc limit). To split into
`exercises` / `plans` / `logs` / `history` subcollections later, only `store.ts` changes —
the rest of the app is already isolated behind the `update`/`state` interface.

---

## Project layout

```
app/
├─ index.html                 app shell + Google Fonts
├─ vite.config.ts             Vite + PWA (manifest, Workbox) + vendor chunk split
├─ firestore.rules            per-user security rules
├─ firebase.json              rules + hosting config
├─ .env.example               Firebase config template
├─ public/                    favicon + PWA icons (192 / 512 / 512-maskable / apple-touch)
└─ src/
   ├─ main.tsx                React entry
   ├─ App.tsx                 shell: tab nav, all mutations, overlays, settings
   ├─ styles.css              design tokens + component styles (ported)
   ├─ types.ts                domain model
   ├─ data/
   │  ├─ store.ts             Firebase | local persistence + auth (the backend boundary)
   │  └─ useStore.ts          React binding (useSyncExternalStore)
   ├─ lib/
   │  ├─ seed.ts              default library, sample plan, buildClaudePrompt
   │  ├─ calc.ts              1RM / volume helpers (verbatim)
   │  ├─ plan.ts              JSON-import validation + normalization (pure)
   │  ├─ selectors.ts         getLog / exDone / dayProgress / exerciseStats
   │  └─ format.ts            time / date helpers
   ├─ components/             Icon, Sheet, Ring, Charts, Stepper, GroupDot, TabBar
   └─ screens/               TodayScreen, PlanScreen, LibraryScreen, ProgressScreen,
                              ExerciseDetail, SwapSheet, SettingsSheet
```

---

## Notes vs. the prototype

- The fake phone bezel + status bar from the reference were dropped; the app fills the device
  and respects `safe-area-inset-*`. On a desktop viewport it's framed as a centered
  phone-width column so it still looks intentional.
- Settings (theme / typeface / nav / weight unit / reset) live in a bottom sheet opened from
  the gear on the Progress tab, plus the account controls Firebase enables.
- Everything else — Focus/Full-day runner, rest timer, set rows & steppers, the two-step JSON
  import with live validation, the library editor, swap/add, and the Progress analytics +
  exercise detail — matches the handoff spec.
