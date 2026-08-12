# Fireplace — MVP Development Roadmap

## Phase 0 — Foundation (this sprint start)

- [x] Architecture docs
- [x] Next.js + TS + Tailwind scaffold
- [x] Prisma schema + PostgreSQL
- [x] Auth.js (credentials + Google optional)
- [x] RBAC helpers + middleware
- [x] Storage abstraction (local)
- [x] Design tokens / base UI
- [x] Seed script
- [x] Verify: `build`, `lint`, `tsc`

## Phase 1a — Identity & Profiles

- [x] Landing page
- [x] Register / login
- [x] Onboarding steps 1–4
- [x] Profile page + privacy settings
- [x] Resume upload
- [x] Layoff status display

## Phase 1b — Community

- [x] Feed + create post
- [x] Categories, comments, reactions, save
- [x] Job opportunity posts + status
- [x] Report content/users

## Phase 1c — Recruiting & Messaging

- [x] Recruiter registration + verification flag
- [x] Candidate search + availability filters
- [x] Contact requests (no PII leak)
- [x] Messaging + message requests + block

## Phase 1d — Admin & Hardening

- [x] Admin dashboard (users, verifications, reports, recruiters)
- [x] Rate limiting on OTP, messages, contact requests
- [x] Seed 20 users / 5 recruiters / posts
- [ ] E2E smoke (Playwright) — next
- [x] Final build verification

## Phase 2 (next)

Groups, Build Something, notifications UI, success stories, job recommendations, advanced search

## Phase 3 (future)

AI matching, resume coach, events, mentorship, company layoff pages

---

## Quality Gate (after each major feature)

1. App runs (`npm run dev`)
2. `npm run lint`
3. `npm run typecheck`
4. Unit tests for touched lib
5. E2E where user-critical
6. Fix before next feature

## Definition of Done (MVP)

Production-quality foundation: real auth, real DB models, real server authorization, working feed/jobs/search/messaging/admin — not static mocks.
