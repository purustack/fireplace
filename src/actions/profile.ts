"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import {
  professionalSchema,
  layoffSchema,
  privacySchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { storage, storeUpload } from "@/lib/storage";
import { SkillType } from "@prisma/client";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

async function upsertSkills(
  userId: string,
  primary: string[],
  secondary: string[],
) {
  await prisma.userSkill.deleteMany({ where: { userId } });

  const all = [
    ...primary.map((name) => ({ name, type: SkillType.PRIMARY })),
    ...secondary.map((name) => ({ name, type: SkillType.SECONDARY })),
  ];

  for (const item of all) {
    const slug = slugify(item.name);
    const skill = await prisma.skill.upsert({
      where: { slug },
      create: { name: item.name.trim(), slug },
      update: {},
    });
    await prisma.userSkill.create({
      data: { userId, skillId: skill.id, type: item.type },
    });
  }
}

function completeness(fields: Record<string, unknown>): number {
  const values = Object.values(fields);
  const filled = values.filter((v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
  return Math.round((filled / values.length) * 100);
}

export async function saveProfessionalProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();

  const primarySkills = String(formData.get("primarySkills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const secondarySkills = String(formData.get("secondarySkills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lookingFor = String(formData.get("lookingFor") ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = professionalSchema.safeParse({
    jobTitle: formData.get("jobTitle"),
    previousCompany: formData.get("previousCompany"),
    yearsExperience: formData.get("yearsExperience"),
    industry: formData.get("industry"),
    primarySkills,
    secondarySkills,
    preferredWorkLocation: formData.get("preferredWorkLocation") || undefined,
    workPreference: formData.get("workPreference"),
    linkedinUrl: formData.get("linkedinUrl") || "",
    portfolioUrl: formData.get("portfolioUrl") || "",
    about: formData.get("about") || undefined,
    lookingFor,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = parsed.data;
  const profileCompleteness = completeness({
    ...data,
    resume: false,
  });

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      jobTitle: data.jobTitle,
      previousCompany: data.previousCompany,
      yearsExperience: data.yearsExperience,
      industry: data.industry,
      preferredWorkLocation: data.preferredWorkLocation,
      workPreference: data.workPreference,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      about: data.about,
      lookingFor: data.lookingFor,
      profileCompleteness: Math.max(profileCompleteness, 40),
    },
  });

  await upsertSkills(user.id, data.primarySkills, data.secondarySkills);

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStep: Math.max(3, (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).onboardingStep) },
  });

  const current = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (current.onboardingStep < 3) {
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep: 3 } });
  }

  revalidatePath("/app");
  return { ok: true };
}

export async function saveLayoffStatus(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const status = String(formData.get("layoffStatus"));

  const payload =
    status === "SERVING_NOTICE"
      ? {
          layoffStatus: "SERVING_NOTICE" as const,
          lastWorkingDay: formData.get("lastWorkingDay"),
          expectedAvailabilityDate: formData.get("expectedAvailabilityDate"),
        }
      : { layoffStatus: "AVAILABLE_IMMEDIATELY" as const };

  const parsed = layoffSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid layoff details." };
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      layoffStatus: parsed.data.layoffStatus,
      lastWorkingDay:
        parsed.data.layoffStatus === "SERVING_NOTICE"
          ? parsed.data.lastWorkingDay
          : null,
      expectedAvailabilityDate:
        parsed.data.layoffStatus === "SERVING_NOTICE"
          ? parsed.data.expectedAvailabilityDate
          : null,
      profileCompleteness: { increment: 15 },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStep: 4 },
  });

  revalidatePath("/app");
  return { ok: true };
}

export async function uploadResume(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a resume file." };
  }

  try {
    const stored = await storeUpload({
      file,
      prefix: `resumes/${user.id}`,
      kind: "resume",
    });

    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } });
    await prisma.resume.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        storageKey: stored.storageKey,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
      update: {
        storageKey: stored.storageKey,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        uploadedAt: new Date(),
      },
    });

    await prisma.profile.update({
      where: { userId: user.id },
      data: { profileCompleteness: { increment: 10 } },
    });

    revalidatePath("/app/profile");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

function avatarKeyFromUrl(image: string | null | undefined) {
  if (!image?.startsWith("/api/files/")) return null;
  return image.replace(/^\/api\/files\//, "").split("?")[0];
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose a profile photo." };
  }

  try {
    const stored = await storeUpload({
      file,
      prefix: `avatars/${user.id}`,
      kind: "avatar",
    });

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });
    const previousKey = avatarKeyFromUrl(current?.image);
    if (previousKey) await storage.delete(previousKey);

    await prisma.user.update({
      where: { id: user.id },
      data: { image: `/api/files/${stored.storageKey}` },
    });

    revalidatePath("/app", "layout");
    revalidatePath("/app/settings");
    revalidatePath("/app/profile");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  const user = await requireAuth();
  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });
  const key = avatarKeyFromUrl(current?.image);
  if (key) await storage.delete(key);

  await prisma.user.update({
    where: { id: user.id },
    data: { image: null },
  });

  revalidatePath("/app", "layout");
  revalidatePath("/app/settings");
  revalidatePath("/app/profile");
  return { ok: true };
}

export async function updatePrivacySettings(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = privacySchema.safeParse({
    recruiterVisibility: formData.get("recruiterVisibility") === "on",
    publicProfile: formData.get("publicProfile") === "on",
    showPreviousCompany: formData.get("showPreviousCompany") === "on",
    showLocation: formData.get("showLocation") === "on",
    allowMessages: formData.get("allowMessages"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid privacy settings." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function getProfileByUsername(username: string) {
  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      skills: { include: { skill: true } },
      employment: { orderBy: { startDate: "desc" } },
      resume: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          publicProfile: true,
          showPreviousCompany: true,
          showLocation: true,
          recruiterVisibility: true,
          accountStatus: true,
          verification: {
            select: {
              personalEmailVerified: true,
              employmentEmailVerified: true,
              layoffDocStatus: true,
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
          posts: {
            where: { published: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  return profile;
}
