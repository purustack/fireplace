import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  country: z.string().min(2).max(100),
  city: z.string().min(1).max(100),
});

export const professionalSchema = z.object({
  jobTitle: z.string().min(2).max(120),
  previousCompany: z.string().min(1).max(120),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  industry: z.string().min(2).max(100),
  primarySkills: z.array(z.string().min(1).max(60)).min(1).max(15),
  secondarySkills: z.array(z.string().min(1).max(60)).max(15).default([]),
  preferredWorkLocation: z.string().max(120).optional(),
  workPreference: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  about: z.string().max(2000).optional(),
  lookingFor: z.array(z.string().max(120)).max(10).default([]),
});

export const layoffSurveySchema = z.object({
  expected: z.enum(["YES", "SOMEWHAT", "NO", "UNSURE"]).optional(),
  reasons: z
    .array(
      z.enum([
        "ROLE_ELIMINATED",
        "COMPANY_FINANCES",
        "RESTRUCTURE",
        "INTERNAL_POLITICS",
        "PERFORMANCE",
        "SKILLS_GAP",
        "PROJECT_ENDED",
        "UNCLEAR",
        "OTHER",
      ]),
    )
    .max(9)
    .default([]),
  notifiedHow: z
    .enum(["MANAGER_1ON1", "HR_CALL", "EMAIL", "MASS_MEETING", "CHAT", "OTHER"])
    .optional(),
  tenure: z.enum(["UNDER_1", "Y1_2", "Y3_5", "Y6_10", "OVER_10"]).optional(),
  notice: z
    .enum(["NONE", "UNDER_2_WEEKS", "TWO_TO_FOUR_WEEKS", "ONE_TO_TWO_MONTHS", "OVER_TWO_MONTHS"])
    .optional(),
  severance: z.enum(["YES", "NO", "PREFER_NOT"]).optional(),
  supportNeeded: z
    .array(
      z.enum([
        "JOB_SEARCH",
        "RESUME",
        "INTERVIEW_PREP",
        "SKILLS",
        "NETWORKING",
        "PEER_SUPPORT",
      ]),
    )
    .max(6)
    .default([]),
  notes: z.string().max(1000).optional(),
});

export const layoffSchema = z.discriminatedUnion("layoffStatus", [
  z.object({
    layoffStatus: z.literal("AVAILABLE_IMMEDIATELY"),
  }),
  z.object({
    layoffStatus: z.literal("SERVING_NOTICE"),
    lastWorkingDay: z.coerce.date(),
    expectedAvailabilityDate: z.coerce.date(),
  }),
]);

export const privacySchema = z.object({
  recruiterVisibility: z.boolean(),
  publicProfile: z.boolean(),
  showPreviousCompany: z.boolean(),
  showLocation: z.boolean(),
  allowMessages: z.enum(["EVERYONE", "VERIFIED_RECRUITERS", "CONNECTIONS"]),
});

export const createPostSchema = z.object({
  category: z.enum([
    "JOB_OPPORTUNITY",
    "REFERRAL",
    "STARTUP_IDEA",
    "DISCUSSION",
    "LEARNING",
    "CAREER_ADVICE",
    "NEED_HELP",
    "SUCCESS_STORY",
  ]),
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(10000),
  jobStatus: z.enum(["OPEN", "HIRING_IN_PROGRESS", "CLOSED"]).optional(),
  jobMeta: z
    .object({
      experienceRange: z.string().optional(),
      skills: z.array(z.string()).optional(),
      location: z.string().optional(),
      company: z.string().optional(),
    })
    .optional(),
});

export const commentSchema = z.object({
  postId: z.string().cuid(),
  body: z.string().min(1).max(2000),
  parentId: z.string().cuid().optional(),
});

export const candidateSearchSchema = z.object({
  jobTitle: z.string().optional(),
  skills: z.array(z.string()).optional(),
  minYears: z.coerce.number().int().min(0).optional(),
  maxYears: z.coerce.number().int().min(0).optional(),
  location: z.string().optional(),
  workPreference: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  industry: z.string().optional(),
  previousCompany: z.string().optional(),
  availability: z.enum(["IMMEDIATE", "SOON", "SERVING_NOTICE"]).optional(),
  verification: z.enum(["LAYOFF", "EMPLOYMENT_EMAIL", "ANY"]).optional(),
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const recruiterProfileSchema = z.object({
  companyName: z.string().min(2).max(120),
  jobTitle: z.string().min(2).max(120),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  companyEmail: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(2000).optional(),
});

export const contactRequestSchema = z.object({
  candidateId: z.string().cuid(),
  type: z.enum(["INTERVIEW", "JOB_OPPORTUNITY", "RESUME_REQUEST", "GENERAL"]),
  message: z.string().min(10).max(2000),
});

export const messageRequestSchema = z.object({
  toId: z.string().cuid(),
  initialMessage: z.string().min(1).max(2000),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().max(5000).optional().default(""),
});

export const reportSchema = z.object({
  targetType: z.enum(["USER", "POST", "COMMENT", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "FAKE_LAYOFF",
    "HARASSMENT",
    "SPAM",
    "FAKE_RECRUITER",
    "SCAM_JOB",
    "MISLEADING",
    "OFFENSIVE",
    "FAKE_IDENTITY",
    "OTHER",
  ]),
  details: z.string().max(2000).optional(),
});

export const runwaySchema = z.object({
  runwaySavings: z.coerce.number().int().min(0).max(1_000_000_000),
  runwayMonthlyBurn: z.coerce.number().int().min(1).max(10_000_000),
  runwayCurrency: z.enum(["INR", "USD", "EUR", "GBP"]),
});

export const interviewNoteSchema = z.object({
  company: z.string().min(1).max(120),
  role: z.string().max(120).optional(),
  round: z.enum(["SCREEN", "HIRING_MANAGER", "PANEL", "ASSIGNMENT", "OFFER", "OTHER"]),
  happenedAt: z.string().optional(),
  wentWell: z.string().max(4000).optional(),
  toImprove: z.string().max(4000).optional(),
  askNext: z.string().max(2000).optional(),
  nextStep: z.string().max(200).optional(),
  feeling: z.enum(["HOPEFUL", "MIXED", "DRAINED", "UNSURE"]).optional(),
  wantPeerEyes: z.boolean().optional(),
});

export const buildIdeaSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(4000),
  requiredSkills: z.array(z.string().min(1).max(60)).max(10).default([]),
  lookingFor: z.string().max(200).optional(),
  compensationType: z.enum(["EQUITY", "PAID", "VOLUNTEER", "EQUITY_AND_PAID"]),
  workPreference: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
});

export const employmentEmailSchema = z.object({
  employmentEmail: z.string().email(),
});

export const otpSchema = z.object({
  otp: z.string().length(6),
});
