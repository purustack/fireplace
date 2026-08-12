# Fireplace — Application Folder Structure

```
fireplace/
├── docs/                          # Architecture & product docs
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Landing, about
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── onboarding/
│   │   │   ├── professional/page.tsx
│   │   │   ├── layoff/page.tsx
│   │   │   └── verification/page.tsx
│   │   ├── app/                   # Authenticated app shell
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── feed/page.tsx
│   │   │   ├── profile/[username]/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── recruit/
│   │   │       ├── page.tsx
│   │   │       └── candidates/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── verifications/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── recruiters/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── files/[...key]/route.ts   # authorized file serve
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn primitives
│   │   ├── layout/                # Nav, shell, footer
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── feed/
│   │   ├── recruit/
│   │   ├── messaging/
│   │   ├── admin/
│   │   └── marketing/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── index.ts           # Auth.js config
│   │   │   ├── session.ts
│   │   │   └── password.ts
│   │   ├── db.ts                  # Prisma client
│   │   ├── rbac.ts
│   │   ├── rate-limit.ts
│   │   ├── storage/
│   │   │   ├── index.ts
│   │   │   ├── local.ts
│   │   │   └── types.ts
│   │   ├── validations/           # Zod schemas
│   │   ├── matching.ts            # Job match weights (Phase 2 ready)
│   │   └── utils.ts
│   ├── actions/                   # Server actions by domain
│   │   ├── auth.ts
│   │   ├── profile.ts
│   │   ├── verification.ts
│   │   ├── posts.ts
│   │   ├── messages.ts
│   │   ├── recruit.ts
│   │   ├── reports.ts
│   │   └── admin.ts
│   ├── hooks/
│   └── types/
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Principles

- **Route groups** separate marketing, auth, and app chrome.
- **Server Actions** for mutations; Route Handlers for Auth.js and file streaming.
- **Domain actions** keep business logic out of UI components.
- **Storage abstraction** keeps verification docs private behind auth checks.
