# Forge

Bodyweight training app for iOS and Android. No gym, no equipment for the core experience,
15–30 minutes a day. Built with Expo (managed workflow), Expo Router, TypeScript (strict) and
local-first SQLite storage.

> **Status:** Milestone 1 of 7 (foundation). Navigation, theme, exercise content and the data
> layer are in place; the tabs show placeholders that later milestones replace.

## Run it on your phone

You need:

- **Node.js 22 LTS** or newer ([nodejs.org](https://nodejs.org))
- **Expo Go** from the App Store or Google Play, updated to the latest version (this project
  uses Expo SDK 58, and Expo Go only runs the current SDK)
- Phone and computer on the same Wi-Fi network

```bash
cd fitness-app
npm install
npm start
```

Scan the QR code that appears: with the Camera app on iOS, or from inside Expo Go on Android.
The app reloads automatically when you save a file.

If your network blocks device-to-computer connections (common on office or hotel Wi-Fi), use a
tunnel instead:

```bash
npx expo start --tunnel
```

A web preview also runs with `npm run web`. It is handy for a quick look, but the phone is the
real target; some details (switch colours, haptics, audio) differ in the browser.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm start`         | Start the Expo dev server                       |
| `npm test`          | Run the Jest test suite                         |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)               |
| `npm run lint`      | ESLint (Expo config)                            |
| `npm run format`    | Format everything with Prettier                 |
| `npm run check`     | Typecheck + lint + format check + tests, in one |

The database tests run SQLite in memory using Node's built-in `node:sqlite` module (Node 22.5+).
It prints an "experimental feature" warning; that is expected. On older Node versions those
tests are skipped rather than failing.

## Project structure

```
src/
├── app/            Expo Router routes. Thin: each file composes components from elsewhere.
│   └── (tabs)/     Home / Workouts / Exercises / Progress / Settings, each with its own stack
├── components/     Shared UI: Text, Button, Card, Screen, ScreenHeader, EmptyState, Icon
├── content/        Static content shipped with the app (exercise library)
├── db/             SQLite: connection adapter, migrations, repositories
├── domain/         Pure TypeScript types and logic. No React, Expo or database imports.
├── features/       Feature-specific components and logic (boot, settings, …)
├── stores/         Zustand stores (app state)
├── test-utils/     Test helpers (in-memory SQLite)
└── theme/          Colours, spacing, typography, navigation theme
```

Dependencies point one way: `app` → `features` / `components` → `stores` → `db/repositories` →
`domain`. Screens never run SQL directly.

## Adding an exercise

Open `src/content/exercises.ts` and append an object to `EXERCISES`:

```ts
{
  id: 'push-up-pike',            // unique, kebab-case, never renamed once released
  name: 'Pike Push-Up',
  family: 'push-up',             // which ladder it belongs to
  rank: 3,                       // 1 = easiest; equal ranks are alternatives
  measure: 'reps',               // or 'time' for holds
  perSide: false,                // true if the target is "each side"
  difficulty: 'intermediate',
  primaryMuscles: ['shoulders'],
  secondaryMuscles: ['triceps'],
  equipment: [],                 // 'chair' and/or 'pull-up-bar'
  instructions: ['…', '…', '…'],
  commonMistakes: ['…', '…'],
},
```

Then run `npm test`. The content tests catch duplicate ids, gaps in a family's ladder and missing
coaching text. Easier/harder variations are worked out from `family` and `rank`, so there are no
links to maintain by hand. A new movement family also needs an entry in `FAMILIES` and in the
`FamilyId` type in `src/domain/types.ts`.

## Data and storage

- Everything is stored on the device in SQLite (`forge.db`) via `expo-sqlite`. There is no
  account or server.
- The schema lives in `src/db/migrations.ts`, applied in order and tracked with SQLite's
  `user_version`. **Migrations are append-only**: never edit one that has shipped; add a new one.
- Screens and stores talk to repository interfaces (`src/db/repositories/types.ts`), not SQL.
  A future backend can be added as another implementation or as a sync layer next to SQLite.
- User-created rows will use device-generated UUIDs and `updated_at` timestamps so they can be
  synced later without being reshaped.

If the database cannot be opened at launch, the app shows a "Try again" screen instead of
crashing.

## Design

Dark theme by default, orange accent (`#FF6B1A`), condensed bold display type (Barlow Condensed)
for headings and numbers, system font for running text. All tokens are in `src/theme/tokens.ts`.
Touch targets are at least 48pt and buttons go up to 64pt so they are easy to hit mid-workout.
