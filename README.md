# Fireplace

Professional community for people affected by layoffs.

> When one door closes, we build another.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- Auth.js (credentials + optional Google OAuth)
- Zod validation, Vitest unit tests

## Quick start

### 1. Database

Set `DATABASE_URL` in `.env` to your PostgreSQL instance (Neon, Docker, or local).

**Neon (recommended for hosted):** paste your Neon connection string with `sslmode=require`.

**Docker (local):**

```bash
docker compose up -d
# DATABASE_URL=postgresql://fireplace:fireplace@localhost:5432/fireplace
```

**Embedded Postgres (no Docker):**

```bash
npm run db:embedded
# DATABASE_URL=postgresql://fireplace:fireplace@127.0.0.1:54329/fireplace?schema=public
```

### 2. Configure env

```bash
cp .env.example .env
# set AUTH_SECRET (openssl rand -base64 32)
```

### 3. Install, migrate, seed

```bash
npm install
npx prisma db push
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed logins (development only)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fireplace.dev | Password123! |
| Candidate | candidate1@fireplace.dev | Password123! |
| Recruiter | recruiter1@fireplace.dev | Password123! |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest unit tests |
| `npm run db:seed` | Seed development data |
| `npm run db:embedded` | Start embedded PostgreSQL |

## Architecture docs

See `/docs` for product architecture, schema, auth, RBAC, verification, API, and MVP roadmap.

## Privacy

Verification documents, employment email, passwords, and salary/severance data are never shown on public profiles.
