"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { KIT_ITEMS } from "@/lib/kit";
import { normalizeCompany } from "@/lib/company";
import { isLayoffSurveyAnswers } from "@/lib/layoff-survey";
import { runwaySchema } from "@/lib/validations";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

export async function toggleKitItem(itemId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!KIT_ITEMS.some((i) => i.id === itemId)) {
    return { ok: false, error: "Unknown checklist item." };
  }

  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId: user.id },
    select: { kitCompletedIds: true, kitStartedAt: true },
  });

  const has = profile.kitCompletedIds.includes(itemId);
  const kitCompletedIds = has
    ? profile.kitCompletedIds.filter((id) => id !== itemId)
    : [...profile.kitCompletedIds, itemId];

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      kitCompletedIds,
      kitStartedAt: profile.kitStartedAt ?? new Date(),
    },
  });

  revalidatePath("/app/recover");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

export async function setHearthOptIn(optIn: boolean): Promise<ActionResult> {
  const user = await requireAuth();
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId: user.id },
    select: { previousCompany: true, companyKey: true, hearthOptIn: true },
  });

  const companyKey =
    profile.companyKey ||
    (profile.previousCompany ? normalizeCompany(profile.previousCompany) : null);

  if (optIn && !companyKey) {
    return { ok: false, error: "Add your previous company on your profile first." };
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      hearthOptIn: optIn,
      companyKey,
    },
  });

  if (optIn && companyKey && !profile.hearthOptIn) {
    const peers = await prisma.profile.findMany({
      where: {
        companyKey,
        hearthOptIn: true,
        userId: { not: user.id },
      },
      select: { userId: true },
      take: 40,
    });
    if (peers.length) {
      await prisma.notification.createMany({
        data: peers.map((p) => ({
          userId: p.userId,
          type: "HEARTH_JOIN" as const,
          title: "Someone from your company joined the hearth",
          body: `${user.name.split(" ")[0]} opted in. They’re in the same boat — not a recruiter.`,
          href: "/app/recover/hearth",
        })),
      });
    }
  }

  revalidatePath("/app/recover/hearth");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

export async function saveRunway(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = runwaySchema.safeParse({
    runwaySavings: formData.get("runwaySavings"),
    runwayMonthlyBurn: formData.get("runwayMonthlyBurn"),
    runwayCurrency: formData.get("runwayCurrency") || "INR",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid numbers." };
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      runwaySavings: parsed.data.runwaySavings,
      runwayMonthlyBurn: parsed.data.runwayMonthlyBurn,
      runwayCurrency: parsed.data.runwayCurrency,
      runwayUpdatedAt: new Date(),
    },
  });

  const kit = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { kitCompletedIds: true },
  });
  if (kit && !kit.kitCompletedIds.includes("runway")) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { kitCompletedIds: [...kit.kitCompletedIds, "runway"] },
    });
  }

  revalidatePath("/app/recover/runway");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

export async function getRecoverSnapshot() {
  const user = await requireAuth();
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  const weeksLeft =
    profile.runwaySavings != null && profile.runwayMonthlyBurn
      ? Math.max(0, Math.round((profile.runwaySavings / profile.runwayMonthlyBurn) * 4.3))
      : null;

  const survey = isLayoffSurveyAnswers(profile.layoffSurvey) ? profile.layoffSurvey : null;

  return { profile, weeksLeft, survey };
}

export async function getCompanyHearth() {
  const user = await requireAuth();
  const me = await prisma.profile.findUniqueOrThrow({
    where: { userId: user.id },
    select: {
      previousCompany: true,
      companyKey: true,
      hearthOptIn: true,
      jobTitle: true,
    },
  });

  const companyKey =
    me.companyKey || (me.previousCompany ? normalizeCompany(me.previousCompany) : null);

  if (!companyKey || !me.hearthOptIn) {
    return { me, companyKey, members: [] as Awaited<ReturnType<typeof hearthMembers>> };
  }

  const members = await hearthMembers(companyKey, user.id);
  return { me, companyKey, members };
}

async function hearthMembers(companyKey: string, excludeUserId: string) {
  return prisma.profile.findMany({
    where: {
      companyKey,
      hearthOptIn: true,
      userId: { not: excludeUserId },
      user: {
        accountStatus: { notIn: ["BANNED", "SUSPENDED"] },
        roles: { has: "USER" as const },
      },
    },
    select: {
      userId: true,
      jobTitle: true,
      layoffStatus: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { username: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });
}
