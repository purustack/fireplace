"use server";

import { prisma } from "@/lib/db";
import { requireAuth, hasRole } from "@/lib/rbac";
import {
  candidateSearchSchema,
  recruiterProfileSchema,
  contactRequestSchema,
} from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { hasLayoffVerifiedBadge } from "@/lib/verification-badge";

export async function registerRecruiterProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = recruiterProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    jobTitle: formData.get("jobTitle"),
    companyWebsite: formData.get("companyWebsite") || "",
    linkedinUrl: formData.get("linkedinUrl") || "",
    companyEmail: formData.get("companyEmail") || "",
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.$transaction([
    prisma.recruiterProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName: parsed.data.companyName,
        jobTitle: parsed.data.jobTitle,
        companyWebsite: parsed.data.companyWebsite || null,
        linkedinUrl: parsed.data.linkedinUrl || null,
        companyEmail: parsed.data.companyEmail || null,
        bio: parsed.data.bio,
        verified: false,
      },
      update: {
        companyName: parsed.data.companyName,
        jobTitle: parsed.data.jobTitle,
        companyWebsite: parsed.data.companyWebsite || null,
        linkedinUrl: parsed.data.linkedinUrl || null,
        companyEmail: parsed.data.companyEmail || null,
        bio: parsed.data.bio,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        roles: user.roles.includes(Role.RECRUITER)
          ? user.roles
          : [...user.roles, Role.RECRUITER],
      },
    }),
  ]);

  revalidatePath("/app/recruit");
  return { ok: true };
}

export async function searchCandidates(raw: unknown) {
  const user = await requireAuth();
  if (!hasRole(user, Role.RECRUITER, Role.MODERATOR, Role.ADMIN)) {
    throw new Error("Recruiter access required.");
  }

  const parsed = candidateSearchSchema.safeParse(raw);
  if (!parsed.success) {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }

  const f = parsed.data;
  const soonCutoff = addDays(new Date(), 30);

  const profiles = await prisma.profile.findMany({
    where: {
      user: {
        recruiterVisibility: true,
        accountStatus: { in: ["VERIFIED", "PENDING", "UNDER_REVIEW"] },
        ...(f.verification === "LAYOFF"
          ? {
              verification: {
                layoffDocStatus: "VERIFIED",
                documents: {
                  some: {
                    status: "VERIFIED",
                    mimeType: "application/pdf",
                  },
                },
              },
            }
          : f.verification === "EMPLOYMENT_EMAIL"
            ? { verification: { employmentEmailVerified: true } }
            : {}),
      },
      ...(f.jobTitle
        ? { jobTitle: { contains: f.jobTitle, mode: "insensitive" } }
        : {}),
      ...(f.location
        ? {
            OR: [
              { city: { contains: f.location, mode: "insensitive" } },
              { country: { contains: f.location, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(f.industry
        ? { industry: { contains: f.industry, mode: "insensitive" } }
        : {}),
      ...(f.previousCompany
        ? { previousCompany: { contains: f.previousCompany, mode: "insensitive" } }
        : {}),
      ...(f.workPreference ? { workPreference: f.workPreference } : {}),
      ...(f.minYears != null || f.maxYears != null
        ? {
            yearsExperience: {
              ...(f.minYears != null ? { gte: f.minYears } : {}),
              ...(f.maxYears != null ? { lte: f.maxYears } : {}),
            },
          }
        : {}),
      ...(f.availability === "IMMEDIATE"
        ? { layoffStatus: "AVAILABLE_IMMEDIATELY" }
        : f.availability === "SERVING_NOTICE"
          ? { layoffStatus: "SERVING_NOTICE" }
          : f.availability === "SOON"
            ? {
                layoffStatus: "SERVING_NOTICE",
                expectedAvailabilityDate: { lte: soonCutoff },
              }
            : {}),
      ...(f.skills?.length
        ? {
            skills: {
              some: {
                skill: {
                  OR: f.skills.map((s) => ({
                    name: { equals: s, mode: "insensitive" as const },
                  })),
                },
              },
            },
          }
        : {}),
      ...(f.query
        ? {
            OR: [
              { jobTitle: { contains: f.query, mode: "insensitive" } },
              { user: { name: { contains: f.query, mode: "insensitive" } } },
              { previousCompany: { contains: f.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    omit: { layoffSurvey: true, layoffSurveyAt: true },
    include: {
      skills: { include: { skill: true }, take: 8 },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          showLocation: true,
          showPreviousCompany: true,
          verification: {
            select: {
              layoffDocStatus: true,
              employmentEmailVerified: true,
              personalEmailVerified: true,
              documents: {
                select: {
                  id: true,
                  status: true,
                  mimeType: true,
                  fileName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ layoffStatus: "asc" }, { updatedAt: "desc" }],
    skip: (f.page - 1) * f.pageSize,
    take: f.pageSize,
  });

  const total = await prisma.profile.count({
    where: {
      user: { recruiterVisibility: true },
      ...(f.availability === "IMMEDIATE"
        ? { layoffStatus: "AVAILABLE_IMMEDIATELY" }
        : {}),
    },
  });

  // Verified first (requires approved termination-letter PDF)
  const items = [...profiles].sort((a, b) => {
    const av = hasLayoffVerifiedBadge(a.user.verification) ? 1 : 0;
    const bv = hasLayoffVerifiedBadge(b.user.verification) ? 1 : 0;
    return bv - av;
  });

  return { items, total, page: f.page, pageSize: f.pageSize };
}

export async function createContactRequest(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!hasRole(user, Role.RECRUITER, Role.ADMIN)) {
    return { ok: false, error: "Only recruiters can contact candidates." };
  }

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: user.id },
  });
  if (!recruiter?.verified && !hasRole(user, Role.ADMIN)) {
    return { ok: false, error: "Recruiter verification required before contacting candidates." };
  }

  const limit = rateLimit(`contact:${user.id}`, 20, 24 * 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Daily contact request limit reached." };
  }

  const parsed = contactRequestSchema.safeParse({
    candidateId: formData.get("candidateId"),
    type: formData.get("type"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid contact request." };
  }

  const candidate = await prisma.user.findUnique({
    where: { id: parsed.data.candidateId },
  });
  if (!candidate?.recruiterVisibility) {
    return { ok: false, error: "This candidate is not available to recruiters." };
  }

  await prisma.recruiterContactRequest.create({
    data: {
      recruiterId: user.id,
      candidateId: parsed.data.candidateId,
      type: parsed.data.type,
      message: parsed.data.message,
    },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.candidateId,
      type: "RECRUITER_CONTACT",
      title: "New recruiter contact request",
      body: parsed.data.message.slice(0, 140),
      href: "/app/messages",
    },
  });

  revalidatePath("/app/recruit");
  return { ok: true };
}

export async function respondContactRequest(
  requestId: string,
  decision: "ACCEPTED" | "DECLINED",
): Promise<ActionResult> {
  const user = await requireAuth();
  const req = await prisma.recruiterContactRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.candidateId !== user.id) {
    return { ok: false, error: "Request not found." };
  }

  await prisma.recruiterContactRequest.update({
    where: { id: requestId },
    data: { status: decision },
  });

  if (decision === "ACCEPTED") {
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user.id }, { userId: req.recruiterId }],
        },
        messages: {
          create: {
            senderId: req.recruiterId,
            body: req.message,
          },
        },
      },
    });
    void conversation;
  }

  revalidatePath("/app/messages");
  return { ok: true };
}
