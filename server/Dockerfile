FROM node:20-alpine

WORKDIR /app

# Install dependencies first so Docker can cache this layer.
COPY package*.json ./
RUN npm ci

# Prisma client must be generated against the schema.
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Apply pending migrations, seed reference data (idempotent), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/index.ts"]
