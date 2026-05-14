# FreeFit

## Backend (Phase 1)

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Environment
1. Copy `server/.env.example` to `server/.env`.
2. Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.

### Run backend
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

Server runs on `http://localhost:3000`.

### Quick API checks
```bash
# Health
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
```