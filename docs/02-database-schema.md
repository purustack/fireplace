# Fireplace — Database Schema

## Conventions

- Primary keys: `cuid()` (Prisma default) unless noted
- Timestamps: `createdAt`, `updatedAt` on all mutable entities
- Soft moderation: `status` enums over hard deletes where possible
- Indexes on: skills, availability, location, jobTitle, company, user status

---

## Enums

```prisma
enum Role {
  USER
  RECRUITER
  MODERATOR
  ADMIN
}

enum LayoffStatusType {
  SERVING_NOTICE
  AVAILABLE_IMMEDIATELY
}

enum WorkPreference {
  REMOTE
  HYBRID
  ONSITE
}

enum VerificationLevel {
  NONE
  EMAIL_VERIFIED
  EMPLOYMENT_EMAIL_VERIFIED
  LAYOFF_VERIFIED
}

enum VerificationDocStatus {
  PENDING
  UNDER_REVIEW
  VERIFIED
  REJECTED
}

enum PostCategory {
  JOB_OPPORTUNITY
  REFERRAL
  STARTUP_IDEA
  DISCUSSION
  LEARNING
  CAREER_ADVICE
  NEED_HELP
  SUCCESS_STORY
}

enum JobPostStatus {
  OPEN
  HIRING_IN_PROGRESS
  CLOSED
}

enum MessageRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum ReportReason {
  FAKE_LAYOFF
  HARASSMENT
  SPAM
  FAKE_RECRUITER
  SCAM_JOB
  MISLEADING
  OFFENSIVE
  FAKE_IDENTITY
  OTHER
}

enum ReportStatus {
  PENDING
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}

enum ModerationStatus {
  PENDING
  UNDER_REVIEW
  VERIFIED
  REJECTED
  SUSPENDED
  BANNED
}

enum ContactRequestType {
  INTERVIEW
  JOB_OPPORTUNITY
  RESUME_REQUEST
  GENERAL
}

enum ContactRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum NotificationType {
  NEW_MESSAGE
  RECRUITER_CONTACT
  NEW_COMMENT
  NEW_REPLY
  JOB_MATCH
  OPPORTUNITY_POSTED
  VERIFICATION_APPROVED
  VERIFICATION_REJECTED
  REPORT_STATUS
  GROUP_ACTIVITY
}

enum SkillType {
  PRIMARY
  SECONDARY
}

enum MessageAllow {
  EVERYONE
  VERIFIED_RECRUITERS
  CONNECTIONS
}
```

---

## Core Models (MVP)

### User
- id, email (unique), emailVerified, passwordHash (nullable for OAuth)
- name, image, roles: Role[]
- accountStatus: ModerationStatus (default PENDING → active after email verify as VERIFIED)
- recruiterVisibility, publicProfile, showPreviousCompany, showLocation
- allowMessages: MessageAllow
- createdAt, updatedAt
- Relations: accounts, sessions, profile, recruiterProfile, posts, etc.

### Profile
- userId (unique)
- username (unique, slug)
- headline / jobTitle
- previousCompany, yearsExperience, industry
- city, country, preferredWorkLocation
- workPreference: WorkPreference
- linkedinUrl, portfolioUrl
- about
- lookingFor: String[] (JSON)
- layoffStatus: LayoffStatusType
- lastWorkingDay, expectedAvailabilityDate (nullable)
- profileCompleteness: Int (0–100)
- Relations: skills, employment, resume, verification

### Skill / UserSkill
- Skill: id, name (unique, normalized), slug
- UserSkill: userId, skillId, type (PRIMARY|SECONDARY)

### Employment
- profileId, companyName, title, startDate, endDate, isCurrent, description

### Resume
- profileId, storageKey, fileName, mimeType, sizeBytes, uploadedAt

### Verification
- userId
- personalEmailVerified: Boolean
- employmentEmail (encrypted/hashed display never public), employmentEmailVerified
- employmentEmailOtpHash, employmentEmailOtpExpires
- layoffDocStatus: VerificationDocStatus
- Relations: documents[]

### VerificationDocument
- verificationId, storageKey, fileName, mimeType, sizeBytes
- reviewedById, reviewedAt, reviewNotes
- status: VerificationDocStatus
- **Never exposed via public APIs**

### Post
- authorId, category: PostCategory, title, body
- jobStatus: JobPostStatus? (for JOB_OPPORTUNITY)
- jobMeta: JSON? (experience range, skills, location)
- published, createdAt, updatedAt
- Indexes: category, authorId, createdAt

### Comment / Reaction / SavedPost
- Comment: postId, authorId, parentId?, body
- Reaction: postId, userId, type (unique per user+post)
- SavedPost: userId, postId

### RecruiterProfile
- userId, companyName, jobTitle, companyWebsite, linkedinUrl
- companyEmail, companyEmailVerified
- verified: Boolean (admin-approved)
- bio

### RecruiterContactRequest
- recruiterId, candidateId, type, message, status
- Rate-limited creation

### Conversation / Message / MessageRequest / Block
- Conversation: participantIds (via ConversationParticipant)
- Message: conversationId, senderId, body, readAt
- MessageRequest: fromId, toId, status, initialMessage
- Block: blockerId, blockedId

### Report
- reporterId, targetType (USER|POST|COMMENT|MESSAGE), targetId
- reason, details, status
- assignedToId?

### ModerationAction / AuditLog
- actorId, targetType, targetId, action, notes, metadata JSON

### Notification
- userId, type, title, body, href, readAt, metadata

### Group / GroupMember / StartupIdea (Phase 2 schema present, UI deferred)
- Included in schema for forward compatibility; seeded lightly

### SavedJob
- userId, postId (job opportunity posts)

---

## Key Indexes

```
Profile: layoffStatus, city, country, previousCompany, jobTitle, yearsExperience
UserSkill: skillId, userId
Post: category, createdAt, jobStatus
Report: status, createdAt
VerificationDocument: status
```

---

## ER Overview

```
User 1──1 Profile 1──* UserSkill *──1 Skill
User 1──1 Verification 1──* VerificationDocument
User 1──1 RecruiterProfile
User 1──* Post 1──* Comment
User 1──* Report
User *──* Conversation (via participants)
```
