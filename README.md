# FreeFit

[![CI](https://github.com/nicholasC0626/FreeFit/actions/workflows/ci.yml/badge.svg)](https://github.com/nicholasC0626/FreeFit/actions/workflows/ci.yml)

**A full-stack fitness app that replaces a paid stack of MyFitnessPal + a workout logger + a personal trainer — built from scratch with React Native and Node.js.**

FreeFit combines macro-based nutrition tracking, a progressive-overload training log, and an AI coach (Google Gemini) in one mobile app, backed by a typed REST API with a PostgreSQL database, automated tests, CI, and a containerized deployment.

<!-- TODO: add screenshots — e.g. a row of 3-4 phone captures (nutrition dashboard, barcode scanner, progress charts, AI trainer) -->

---

## Features

### 🍎 Nutrition tracking
- **Personalized daily targets** — calories and protein/carbs/fat computed from the user's age, sex, height, weight, activity level, and goal (BMR → TDEE with activity multipliers, goal-based surplus/deficit, protein scaled to body weight)
- **Food logging by meal** with a live "calories remaining" dashboard and macro progress bars, browsable by day
- **Food database search** backed by the USDA FoodData Central API (300k+ branded and whole foods), proxied server-side so API keys never ship to the client
- **Barcode scanner** — point the camera at any package; the product is looked up on Open Food Facts (3M+ products) and its nutrition auto-fills the log
- **Whole-food meal suggestions** sized to fit the macros you have *left* today, ranked by a custom scoring algorithm
- **Fast-food guide** — a seeded database of restaurant items filterable by calorie cap and protein floor
- **AI grocery lists** — Gemini generates a budget-aware, whole-foods shopping list from your macro targets and dietary restrictions

### 🏋️ Training
- **Program builder** — multi-day workout programs with per-exercise set and rep-range targets
- **Live workout sessions** — log sets (weight × reps) as you train, resume in-progress workouts, append unplanned exercises mid-session
- **Automatic PR detection** — every set is checked against your all-time best for that exercise; new records trigger haptic feedback
- **Progress charts** — per-exercise estimated 1RM trend line (Epley formula) and per-session volume bars, drawn with `react-native-svg`, plus a personal-records board

### 🤖 AI trainer (Google Gemini)
- **Chat coach** with conversation context for training and nutrition questions
- **One-tap program generation** — builds a complete lifting program from your profile (experience, goal, gym days/week) and saves it as an editable program
- **Program review** — the AI audits any program for muscle-group imbalances, redundancy, volume issues, and exercise ordering
- **Exercise suggestions** — top-5 ranked exercises per muscle group with coaching cues and common mistakes

### 🔔 Smart notifications
- Cron-based scheduler (`node-cron`) sends push notifications via Expo's push service: morning workout kickoffs, follow-ups if you haven't trained, and nutrition nudges if you forget to log meals
- Quiet-hours aware, per-user opt-in toggles, device token registration handled automatically

### 📱 Product polish
- **Dark mode** — full light/dark theming from a semantic design-token system, following the OS setting or a manual in-app toggle (persisted per device)
- **Onboarding wizard** that builds the user's metabolic profile in four steps
- Pull-to-refresh, optimistic toggles, empty states, and per-request error recovery throughout

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81 · Expo SDK 54 · Expo Router (file-based, typed routes) · TypeScript (strict) · Zustand |
| API | Node.js · Express 5 · TypeScript · Zod request validation |
| Database | PostgreSQL · Prisma ORM (migrations + seeding) |
| AI | Google Gemini |
| External data | USDA FoodData Central (search) · Open Food Facts (barcodes) — both proxied server-side |
| Auth & security | JWT access + refresh tokens · bcrypt password hashing · Helmet · rate limiting |
| Testing | Vitest — unit tests for business logic + integration tests against a real Postgres via Supertest |
| CI/CD | GitHub Actions (tests + type-checks on every push/PR) · Docker · Railway · Expo EAS |

## Architecture

```
FreeFit/
├── mobile/                  # Expo app
│   ├── app/                 # File-based routes: (auth), (tabs), training/, nutrition/, ai/
│   ├── components/          # Shared UI (charts, modals, scanner)
│   ├── constants/theme.ts   # Semantic light/dark design tokens
│   ├── services/            # Typed API clients (axios)
│   └── stores/              # Zustand stores (session, theme) persisted to SecureStore
├── server/
│   ├── src/
│   │   ├── routes/          # Express routers per domain
│   │   ├── controllers/     # HTTP handling + validation
│   │   ├── services/        # Business logic (PR detection, suggestion scoring, AI prompts)
│   │   ├── middleware/      # Auth, validation, central error handling
│   │   └── utils/           # Pure logic (macro calculator) — unit tested
│   ├── prisma/              # Schema, migrations, idempotent seed
│   └── tests/               # Vitest unit + integration suites
└── .github/workflows/ci.yml
```

Design decisions worth noting:

- **All third-party API calls happen server-side** (Gemini, USDA, Open Food Facts) — the mobile app holds zero secrets, and responses are normalized into one consistent shape before reaching the client.
- **Route protection on both ends**: Express middleware verifies JWTs per request, while the mobile root layout has a navigation guard that redirects by auth/onboarding state.
- **PR detection is transactional** — each logged set is compared against the user's historical best inside the same request that persists it, so records are never missed or double-counted.
- **The theme system is a single hook** — every screen builds its styles from semantic tokens (`useTheme()`), so the entire app, including navigation chrome, re-themes from one source of truth.
- **The server boots migrations + seed on container start**, making Railway deploys fully hands-off.

---

## Running it locally

### Prerequisites
- Node.js 20.19.4+ (required by React Native 0.81)
- PostgreSQL running locally

### Backend
1. Copy `server/.env.example` to `server/.env` and fill in `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (and `GEMINI_API_KEY` + `USDA_API_KEY` for AI/food search — barcode lookup needs no key).
2. Then:

```bash
cd server
npm install
npx prisma migrate dev
npm run seed        # loads fast-food reference data
npm run dev         # http://localhost:3000
```

> Windows note: if `npm run dev` fails with EPERM on Prisma's DLL, kill any other Node process using port 3000 first, or run `npx tsx watch src/index.ts` directly.

### Mobile
```bash
cd mobile
npm install
npx expo start
```
Press `w` for web, or scan the QR code with Expo Go. The app auto-detects the API at the Expo host IP, or set `EXPO_PUBLIC_API_URL`.

### Tests
```bash
cd server
npm test            # unit + integration (integration tests hit the DB in DATABASE_URL)
```

CI (`.github/workflows/ci.yml`) runs server tests against a disposable Postgres and type-checks both projects on every push/PR to `main`.

## Deployment

### Backend → Railway
1. Push the repo to GitHub.
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select this repo, set the root directory to `server/` (Railway will use `server/Dockerfile`).
3. Add a PostgreSQL database to the project (one click) — Railway sets `DATABASE_URL` automatically.
4. Set the remaining environment variables in the Railway dashboard:
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — generate each with `openssl rand -base64 32`
   - `GEMINI_API_KEY` (aistudio.google.com), `USDA_API_KEY` (fdc.nal.usda.gov)
   - `NODE_ENV=production`
5. Deploy. The container runs `prisma migrate deploy` and the idempotent seed on every start, so the database is always up to date.

### Mobile → Expo EAS
```bash
npm install -g eas-cli
eas login
cd mobile && eas build:configure
```
- Set the production API URL: add `EXPO_PUBLIC_API_URL=https://<your-railway-domain>` to `mobile/eas.json` build profiles (or an `.env` consumed by EAS).
- Development build for a real device (needed for push notifications — Expo Go can't receive them without an EAS project):
  ```bash
  eas build --platform android --profile development
  ```
- Production builds + store submission:
  ```bash
  eas build --platform all --profile production
  eas submit --platform android
  eas submit --platform ios   # requires Apple Developer account
  ```
- JS-only updates after launch, no store review: `eas update --branch production`.

### Post-deploy checklist
- [ ] `https://<railway-domain>/health` returns `{ ok: true }`
- [ ] Register/login from the deployed mobile build
- [ ] AI chat replies (verifies `GEMINI_API_KEY` in production)
- [ ] Food search returns results (verifies `USDA_API_KEY`)
- [ ] Barcode scan finds a product (uses Open Food Facts — no API key needed)
- [ ] Push notifications arrive on a physical device
