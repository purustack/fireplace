# Fireplace — API Design

MVP prefers **Server Actions** for mutations. Route Handlers for Auth.js, health, and authorized file delivery.

## Conventions

- Input: Zod schemas in `src/lib/validations`
- Errors: `{ error: string, code?: string }` or thrown `ActionError`
- Auth: session required unless noted
- Idempotency: contact requests unique on (recruiterId, candidateId, PENDING)

---

## Auth

| Method | Path / Action | Description |
|--------|---------------|-------------|
| POST | `signUp` | Create user |
| — | Auth.js `/api/auth/*` | Login, logout, OAuth, CSRF |
| POST | `verifyEmail` | Personal email OTP |
| POST | `requestPasswordReset` | Send reset token |

## Profile & Onboarding

| Action | Description |
|--------|-------------|
| `updateProfessionalProfile` | Step 2 fields + skills |
| `updateLayoffStatus` | Step 3 status + dates |
| `uploadResume` | Private resume storage |
| `updatePrivacySettings` | Visibility toggles |
| `getPublicProfile(username)` | Privacy-filtered |

## Verification

| Action | Description |
|--------|-------------|
| `requestEmploymentEmailOtp` | Send OTP |
| `confirmEmploymentEmailOtp` | Verify OTP |
| `uploadLayoffDocument` | Private upload |
| `adminReviewDocument` | MOD/ADMIN |

## Feed & Posts

| Action | Description |
|--------|-------------|
| `createPost` | Category + body (+ job meta) |
| `updateJobStatus` | OPEN / IN_PROGRESS / CLOSED |
| `listFeed` | Cursor pagination |
| `addComment` / `toggleReaction` / `toggleSave` |
| `reportContent` | Create report |

## Recruiting

| Action | Description |
|--------|-------------|
| `searchCandidates` | Filters incl. availability |
| `createContactRequest` | Rate-limited |
| `respondContactRequest` | Candidate accept/decline |
| `registerRecruiterProfile` | Recruiter onboarding |

## Messaging

| Action | Description |
|--------|-------------|
| `sendMessageRequest` | Initial request |
| `respondMessageRequest` | Accept/reject |
| `sendMessage` | In accepted conversation |
| `blockUser` | Block |

## Admin

| Action | Description |
|--------|-------------|
| `listUsers` / `setUserStatus` | Suspend/ban |
| `listReports` / `resolveReport` | Moderation |
| `listVerifications` / `reviewVerification` | Docs |
| `verifyRecruiter` | Approve recruiters |

## Files

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/files/[...key]` | AuthZ check then stream |

---

## Candidate Search Query (logical)

```
filters: {
  jobTitle?, skills[], minYears?, maxYears?,
  location?, workPreference?, industry?, previousCompany?,
  availability: 'IMMEDIATE' | 'SOON' | 'SERVING_NOTICE',
  verification: 'LAYOFF' | 'EMPLOYMENT_EMAIL' | 'ANY'
}
sort: verifiedFirst | recent | experience
only: recruiterVisibility=true AND account active
```
