# FreeFit

Full-stack fitness app: nutrition tracking with barcode scanning, progressive-overload training log, AI trainer (Gemini), whole-food meal suggestions, and smart push notifications.

- `mobile/` — React Native + Expo (SDK 54), Expo Router, Zustand
- `server/` — Node.js + Express + Prisma + PostgreSQL

## Local development

### Prerequisites
- Node.js 20.19.4+ (required by React Native 0.81)
- PostgreSQL running locally

### Backend
1. Copy `server/.env.example` to `server/.env` and fill in `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (and `GEMINI_API_KEY` + `USDA_API_KEY` for AI/food search).
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
