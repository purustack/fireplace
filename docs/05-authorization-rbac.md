# Fireplace — Authorization / RBAC

## Roles

| Role | Capabilities |
|------|----------------|
| USER | Profile, feed, posts, messages, reports, apply/contact respond |
| RECRUITER | Candidate search, contact requests (if verified), own recruiter profile |
| MODERATOR | Review docs, reports, soft-suspend, verify layoff/recruiter |
| ADMIN | All moderator + ban, delete, manage categories/groups, audit |

Roles are stored as `Role[]` on User. A user may be both USER and RECRUITER.

---

## Permission Matrix (MVP)

| Action | USER | Verified Recruiter | MOD | ADMIN |
|--------|------|--------------------|-----|-------|
| Edit own profile | ✓ | ✓ | ✓ | ✓ |
| Create post | ✓ | ✓ | ✓ | ✓ |
| Search candidates (recruiter view) | | ✓ | ✓ | ✓ |
| Send contact request | | ✓* | | |
| Review verification docs | | | ✓ | ✓ |
| Suspend user | | | ✓ | ✓ |
| Ban / hard delete | | | | ✓ |
| Access /admin | | | ✓ | ✓ |

\* Rate-limited; blocked if candidate privacy forbids; requires verified recruiter.

---

## Resource Ownership Rules

- Users can mutate only own Profile, Posts, Comments, Messages (as sender)
- RecruiterContactRequest: recruiter creates; candidate accepts/declines
- VerificationDocument: readable only by owner (metadata) and MOD/ADMIN (full)
- Resume: owner + recruiters with accepted contact OR user opted visibility

---

## Server-Side Enforcement

Every server action:

1. Resolve session
2. Check `accountStatus` ∉ {SUSPENDED, BANNED}
3. Check role / ownership
4. Validate input with Zod
5. Apply rate limit where needed
6. Write AuditLog for moderation actions

**Never trust client role claims.**

---

## Privacy Enforcement

| Field | Public | Recruiter search | Admin |
|-------|--------|------------------|-------|
| Name, title, skills | if publicProfile | if recruiterVisibility | always |
| Previous company | if showPreviousCompany | same | always |
| Location | if showLocation | same | always |
| Employment email | never | never | yes |
| Verification docs | never | never | yes |
| Phone / salary | never (not stored in MVP) | never | n/a |

---

## Messaging Allow Policies

- `EVERYONE` — any authenticated non-blocked user (with message request)
- `VERIFIED_RECRUITERS` — only verified recruiters
- `CONNECTIONS` — accepted conversations only

Blocks always win.
