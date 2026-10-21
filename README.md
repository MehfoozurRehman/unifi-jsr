# UniFi Access to Jisr HR Attendance Bridge

A bridge that turns door-badge swipes from UniFi Access into attendance punches in Jisr HR, with idempotent event storage and an operator panel for matching people.

## The problem

Staff badge in at UniFi Access doors, but attendance is recorded in Jisr HR. Without a bridge, punches are re-keyed by hand or the two systems drift apart. This project receives each UniFi unlock event, stores it once, forwards it to Jisr under a configurable attendance rule, and gives an operator the tools to match UniFi users to Jisr employees when automatic matching falls short.

## What it does

- **Webhook ingestion.** UniFi posts to a Convex HTTP action at `/webhook/unifi` (or `/api/unifi-webhook`). Each raw event is stored before anything else happens.
- **Duplicate protection.** Every event gets a SHA-256 fingerprint. If the UniFi event ID is present it is used; otherwise the fingerprint is built from user, door, timestamp and payload. Redelivered webhooks do not create duplicate punches.
- **Three attendance modes**, selected with `ATTENDANCE_MODE`: `RAW` forwards timestamps and lets Jisr work out in and out; `DIRECTION` uses the reader's IN/OUT; `DOOR_RULES` maps entry and exit door IDs.
- **Employee mapping** (`/mappings`). UniFi users and Jisr employees are cached in Convex, suggested matches are shown, and operators can pair records manually.
- **Audit feed** (`/events`). Lists processed punches and raw webhooks, with JSON detail and a manual retry.
- **Webhook simulator** (`/simulator`) for testing a swipe end to end without a physical reader.

## How it's built

- **Backend: Convex.** The schema has `settings`, `unifiUsers`, `jisrEmployees`, `mappings` and `events` tables. Business logic is split into `unifi.ts`, `jisr.ts`, `attendance.ts`, `mappings.ts` and `settings.ts`, with pure helpers in `convex/lib/` (fingerprinting, Jisr mapping, UniFi mapping, timezone handling).
- **Frontend: Next.js 16 App Router** with React 19, Tailwind CSS v4 and Lucide icons. Pages are `/`, `/mappings`, `/events`, `/settings` and `/simulator`.
- **Time handling.** Luxon formats times in `Asia/Riyadh` by default.

Two decisions stand out:

1. **Store first, derive later.** Raw events are written to an idempotent `events` table keyed by fingerprint. Punches are derived from stored events, so a replayed webhook cannot create a second punch.
2. **Single settings document.** Integration settings live in one `settings` record, seeded from environment variables in `convex/config.ts`. The panel reads operational settings from there.

## Running it locally

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Then:

```bash
npm install
npx convex dev        # or: npm run convex:dev
npm run dev           # next dev
```

Other scripts in `package.json`: `npm run build`, `npm run start`, `npm run lint`.


## What I learned / what I'd do next

- Both `pnpm-lock.yaml` and `package-lock.json` are committed. Picking one package manager would avoid lockfile drift.
- `SYNC_INTERVAL_MINUTES` is saved into the `settings` table, but no scheduled job that reads it was found. Sync appears to be manual.
- There are no automated tests. The helpers in `convex/lib/` (fingerprint, timezone, mappers) are small pure functions and would be the easiest place to start.
- Integration secrets belong in the Convex dashboard or deployment environment, not in committed files.
