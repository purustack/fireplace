# Fireplace — Authentication Architecture

## Provider

**Auth.js (NextAuth v5)** with Prisma adapter.

### Strategies

1. **Credentials** — email + password (bcrypt hashed)
2. **Google OAuth** — optional; linked to same User via Account

### Session

- Strategy: **JWT** (or database sessions — MVP uses JWT + Prisma User lookup for roles)
- Session payload includes: `userId`, `email`, `roles`, `accountStatus`
- Sensitive fields (passwordHash, employment email) never in client session

---

## Registration Flow

```
Step 1 Create account → User + hashed password + email verification token
Step 2 Professional info → Profile + skills + resume
Step 3 Layoff status → Profile.layoffStatus + dates
Step 4 Verification → employment OTP + optional docs
```

Onboarding gate: incomplete profiles redirected to `/onboarding/*` until steps 1–3 done. Step 4 optional but prompted.

---

## Email Verification

- Personal email: magic link / OTP (dev: log OTP to console)
- Employment email: separate OTP; stored hashed; **never shown publicly**
- Mark: `Employment Email Verified ✓` on profile without revealing address

---

## Password Security

- bcrypt (cost 12)
- Min length 8, Zod-validated
- Reset flow: token hashed in DB, expiry 1h (MVP: basic)

---

## OAuth Notes

- Google provides verified personal email
- Does **not** satisfy employment email verification
- First Google login creates USER role; recruiter onboarding is a separate path

---

## Recruiter Auth Path

1. Register/login as user
2. Complete `/onboarding/recruiter` — company email, LinkedIn, website
3. Admin/moderator verifies → `RecruiterProfile.verified = true`
4. Unverified recruiters cannot send contact requests (hard server check)

---

## Session Guards

```ts
requireAuth()           // must be signed in
requireRole(...roles)   // RBAC
requireActiveAccount()  // not SUSPENDED/BANNED
requireOnboarded()      // profile complete
```

Middleware protects `/app/*` and `/admin/*`.

---

## CSRF & Cookies

- Auth.js built-in CSRF for auth routes
- Server Actions use Next.js origin checks
- `httpOnly`, `secure` (prod), `sameSite: lax` session cookies
