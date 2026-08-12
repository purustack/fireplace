# Fireplace — Verification Workflow

## Trust Model (3 levels)

### Level 1 — Employment Email Verification

1. User enters `name@company.com`
2. System sends OTP (6-digit, 10 min expiry, hashed at rest)
3. On success: `employmentEmailVerified = true`
4. Badge: **Employment Email Verified ✓**
5. Address never shown on public/recruiter profile

**Limitation:** Laid-off users may lose company email. Flow is optional; UI explains alternatives.

### Level 2 — Layoff Documentation

1. User uploads PDF/JPG/PNG (max 10MB) — termination/separation/severance letter
2. Stored via private storage key `verification/{userId}/{uuid}`
3. Status: PENDING → UNDER_REVIEW → VERIFIED | REJECTED
4. Moderator reviews in admin queue; adds notes
5. Badge: **Layoff Verified ✓**
6. Document never publicly linkable; served only through authorized admin route

### Level 3 — Community Reporting

1. Report reason includes **Fake layoff** / “voluntarily resigned”
2. Enters moderation queue (does not auto-remove)
3. Admin weighs: report count, evidence, account history, verification status
4. Outcomes: dismiss, warn, suspend, ban, revoke verification

---

## Status Display on Profile

```
Verification
✓ Email Verified              (personal)
✓ Employment Email Verified   (if Level 1)
✓ Layoff Verified             (if Level 2)
```

Unverified accounts remain usable but ranked lower in recruiter search (verified first).

---

## Recruiter Verification

Parallel track:

1. Company email OTP
2. Company name, title, LinkedIn, website
3. Admin approval → **Verified Recruiter ✓**
4. Until verified: browse may be limited; **cannot contact candidates**

---

## Anti-Fraud Notes

- OTP rate limit: 3/hour per email
- Upload rate limit: 5 docs/day
- Virus/mime sniffing: allowlist PDF/JPEG/PNG only
- Audit every verification decision
