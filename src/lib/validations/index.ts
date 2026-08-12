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
  body: z.string().min(1).max(5000),
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

export const employmentEmailSchema = z.object({
  employmentEmail: z.string().email(),
});

export const otpSchema = z.object({
  otp: z.string().length(6),
});
