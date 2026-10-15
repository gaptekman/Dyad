# Dyad

A mobile-first, installable training journal for your six-day anterior/posterior split. React + TypeScript + Vite, with IndexedDB persistence and an offline service worker. No backend, credentials, subscriptions, or cloud synchronization.

## Open and install on your phone


Host the production build at your own HTTPS address, then open that address on your phone. Allow the first page load to finish before going offline.

- **iPhone/iPad:** open the HTTPS address in Safari → Share → Add to Home Screen → Add. Launch Dyad from the new icon once while online.
- **Android:** open in Chrome → menu → Install app (or Add to Home screen). Launch the installed app once while online.
- **Desktop:** use the browser’s install icon/menu, where supported.

The app shell, fonts, and your journal work offline after the production service worker is installed. Development mode does not register a service worker. Browser install prompts and hosting authentication behavior can vary; a real iPhone and Android device were not available for testing. Keep the same origin and browser profile to access the same journal. If an update is waiting, close all Dyad windows and reopen; updates do not replace the app during a session.

## Local setup

Install Node.js 22+ and pnpm 10.17.1, then run in this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL Vite prints. For the production PWA and offline verification:

```sh
pnpm test
pnpm build
pnpm preview
```

`pnpm build` checks TypeScript, bundles the app, then generates a content-versioned precache of the entire static shell. Serve `dist/` at an HTTPS origin with the app at `/`. `localhost` is also a secure context for local tests. An ordinary phone-to-computer HTTP LAN address does not enable service workers or PWA installation; use your deployed HTTPS address or configure trusted local HTTPS. Static hosting must return `index.html` for app navigation and the correct MIME types for JS, JSON, fonts, and the service worker. No environment variables are required.

## Training flow

1. Pick A1, P1, A2, P2, A3, P3, or Rest. The cycle is deliberately independent of weekdays so missed days do not move your program.
2. Pick lower or upper. Sessions can be done in either order and can remain as independent drafts.
3. Enter weight, reps, and RIR, then tap the check. RIR is the number of additional reps you could have performed. Checking a set starts the rest timer. The timer uses an absolute end time and survives reloads; alerts are in-app/vibration only while open.
4. Previous values come from the latest completed session for that exercise in the same unit. Those fields prefill for speed but are unchecked until you log them. Editing a logged field unchecks that set.
5. Finish the session. Partial sessions require an explicit confirmation, and unchecked sets do not contribute to charts, records, or volume. At least one logged set is required.
6. History contains completed sessions and resumable drafts. Progress charts show the heaviest logged set per completed session for the selected exercise and unit. Personal records use heaviest load, then highest reps at that load. Empty states contain no fabricated data.

Settings control kg/lb and rest duration. Changing units affects new sessions; historical numbers are never silently converted. Volume is weight × reps for logged sets; the app does not infer bodyweight, paired dumbbells, or double per-leg volume. Log dumbbells consistently. For Bulgarian split hack squats, perform the reps on each leg, then check the set once. Enter 0 for an unweighted movement.

Core was specified as three sets without a rep range; the default is **3 × 8–12**, editable to match your chosen movement. All other prescriptions match the provided routine. Progression suggests a small increase only when every set reaches the upper rep target with at least 1 RIR; it does not automatically change your loads.

## Edit your routine

My routine → choose a day → Edit day. Rename, add, or remove exercises, and change set counts and rep ranges. Keep at least one exercise in each upper/lower session. Existing sessions preserve their original prescriptions. New exercises get new identities, so their records do not mix with an unrelated movement. Renaming an existing exercise retains its identity and history; add a new exercise when changing the movement itself.

## Data and recovery

- Every edit queues an IndexedDB transaction in order. “Saved on this device” appears after the latest transaction commits. A failed write shows a retry action and an export reminder, and the latest work remains in memory.
- Export backups in Settings regularly. Keep a copy outside the browser. Use Restore backup to move to another device. Restore validates the entire v1 schema before asking to replace data; it does not merge journals.
- Storage is local to this device/browser/origin. Clearing site data, private browsing cleanup, storage eviction, or device loss can remove it. Request persistent storage in Settings; browsers decide whether to grant it.
- Modern browsers use a Web Lock to permit only one open writer tab. A second tab shows a reload screen. Use one Dyad window at a time on browsers without Web Locks.
- No workout data is sent to a server. Fonts and icons are self-hosted. The private hosting service handles access to the Site, not workout synchronization.

## Tests

```sh
pnpm test
pnpm exec playwright install chromium
pnpm build
pnpm preview
# In a separate terminal:
pnpm test:e2e
```

Set `CHECK_OFFLINE=1` for the offline reload/logging checks. `BASE_URL` overrides the default `http://127.0.0.1:4173`; `BROWSER_CHANNEL=msedge` uses an installed Edge browser instead of a Playwright Chromium download. Environment-variable syntax depends on your shell. For example, PowerShell:

```powershell
$env:CHECK_OFFLINE = '1'
$env:BROWSER_CHANNEL = 'msedge'
pnpm test:e2e
```

The browser suite uses a disposable profile and does not touch your personal journal. It covers desktop and mobile layouts, invalid logging, draft reload, partial completion, previous-session prefills, charts and PRs, history, routine snapshots, export/restore, malformed backups, concurrent-tab protection, rest day, and horizontal overflow. Optional offline checks reload the production shell without a network and log/reload another set. Artifacts go to ignored `test-results/`.

Source: `src/domain.ts` (routine, validation, progression, records), `src/storage.ts` (IndexedDB), `src/App.tsx` (UI), `src/style.css`, and `scripts/sw.mjs` (build-time offline cache). Font license files are in `public/fonts/`. The design and Dyad mark are original; no Breathedivinity assets are used.

## Illustrated exercise library

My routine → Edit day → Change opens a searchable exercise library grouped by muscle group. A replacement keeps the slot’s sets and rep range. Already-used exercises in that session are disabled. Add exercise uses the same picker; custom movements remain available. Existing drafts and history keep their original snapshots.

Tap an exercise thumbnail in the training overview or logger to enlarge it and see the exact variation shown. Illustrations are © Simply Fitness and are included with permission confirmed by the project owner. They are optimized locally and included in the offline cache. Movements without an exact library entry retain a numbered tile rather than an unrelated illustration. No third-party requests are made while browsing the library.
