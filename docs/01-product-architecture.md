# Fireplace — Product Architecture

## Vision

Fireplace is a professional community for people affected by layoffs. It is **not** a generic job board. The emotional positioning is:

> “You lost a job. You didn’t lose your career.”

Flow: **Connection → Opportunity → Collaboration → Recovery → Growth**

**Tagline:** When one door closes, we build another.

---

## Ambiguities & Decisions

| Ambiguity | Decision |
|-----------|----------|
| Company email often revoked after layoff | Level 1 verification is optional; Level 2 docs + Level 3 community reporting compensate. Users can verify personal email always; employment email is best-effort. |
| Recruiters who are also laid-off | Separate role `RECRUITER` with optional candidate profile linkage; one account can hold both via `roles` array. |
| Notice vs available status transition | Users can update status; when last working day passes, a cron/job can suggest switching to Available Immediately (Phase 2). MVP: manual update. |
| Public vs recruiter-visible profiles | Independent toggles: `publicProfile` and `recruiterVisibility`. |
| OAuth without company email | Google OAuth allowed for account creation; employment email verification remains separate. |
| File storage in local/dev | Local filesystem adapter in dev; S3-compatible abstraction for production. |
| “Available Soon” filter | Maps to Serving Notice Period with `expectedAvailabilityDate` within 30 days. |

---

## High-Level Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Next.js    │────▶│  Server Actions  │────▶│  PostgreSQL │
│  App Router │     │  + Route Handlers│     │  (Prisma)   │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                     │
       │                     ├── Auth.js (sessions)
       │                     ├── Zod validation
       │                     ├── RBAC guards
       │                     └── Object storage (resumes/docs)
       ▼
  Tailwind + shadcn/ui
```

**Stack**

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind, shadcn/ui |
| Backend | Next.js Server Actions + Route Handlers |
| DB | PostgreSQL + Prisma |
| Auth | Auth.js (NextAuth v5) — credentials + Google |
| Validation | Zod |
| Storage | `lib/storage` — local (dev) / S3 (prod) |
| Tests | Vitest (unit), Playwright (E2E) |

---

## Core Domains

1. **Identity & Auth** — users, sessions, roles, OAuth
2. **Profiles** — candidate professional data, skills, privacy
3. **Layoff & Verification** — status, employment email OTP, document review
4. **Community Feed** — posts, comments, reactions, saves, reports
5. **Jobs** — opportunity posts with Open / In Progress / Closed
6. **Recruiting** — recruiter profiles, candidate search, contact requests
7. **Messaging** — conversations, requests, blocks
8. **Moderation** — reports, admin queue, audit log
9. **Build Something** (Phase 2) — startup ideas
10. **Groups** (Phase 2) — community groups

---

## User Types

| Role | Purpose |
|------|---------|
| `USER` | Laid-off professional (default) |
| `RECRUITER` | Hiring / talent acquisition |
| `MODERATOR` | Review reports & docs |
| `ADMIN` | Full platform control |

---

## Layoff Statuses (exactly two)

1. **SERVING_NOTICE** — 🟠 Laid Off — Serving Notice Period  
   Optional: last working day, notice remaining, expected availability
2. **AVAILABLE_IMMEDIATELY** — 🟢 Laid Off — Available Immediately

Voluntary resignations are out of scope; trust comes from verification + reporting, not a checkbox alone.

---

## Privacy Principles

Never publicly expose:

- Termination / severance documents
- Salary / severance amounts
- Private email / phone
- Employment email (even when verified)
- Passwords

Verification documents: private storage, admin/moderator only.

---

## Application Surfaces

| Surface | Route prefix |
|---------|--------------|
| Marketing | `/` |
| Auth / onboarding | `/auth/*`, `/onboarding/*` |
| App (authenticated) | `/app/*` |
| Recruiter | `/app/recruit/*` |
| Admin | `/admin/*` |
| Public profiles | `/u/[username]` |
| API | `/api/*` |
