"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireStaff, requireAdmin } from "@/lib/rbac";
import { reportSchema } from "@/lib/validations";
import { ModerationStatus, Role } from "@prisma/client";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

export async function createReport(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid report." };
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });

  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function resolveReport(opts: {
  reportId: string;
  status: "RESOLVED" | "DISMISSED";
  resolution?: string;
}): Promise<ActionResult> {
  const staff = await requireStaff();

  const report = await prisma.report.update({
    where: { id: opts.reportId },
    data: {
      status: opts.status,
      resolution: opts.resolution,
      assignedToId: staff.id,
    },
  });

  await prisma.moderationAction.create({
    data: {
      actorId: staff.id,
      targetType: "Report",
      targetId: report.id,
      action: opts.status,
      notes: opts.resolution,
    },
  });

  await prisma.notification.create({
    data: {
      userId: report.reporterId,
      type: "REPORT_STATUS",
      title: "Report update",
      body: `Your report was marked ${opts.status.toLowerCase()}.`,
      href: "/app/settings",
    },
  });

  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function setUserModerationStatus(opts: {
  userId: string;
  status: ModerationStatus;
  notes?: string;
}): Promise<ActionResult> {
  const actor = opts.status === "BANNED" ? await requireAdmin() : await requireStaff();

  if (opts.status === "BANNED" && actor.id === opts.userId) {
    return { ok: false, error: "Cannot ban yourself." };
  }

  await prisma.user.update({
    where: { id: opts.userId },
    data: { accountStatus: opts.status },
  });

  await prisma.moderationAction.create({
    data: {
      actorId: actor.id,
      targetType: "User",
      targetId: opts.userId,
      action: opts.status,
      notes: opts.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: `USER_${opts.status}`,
      entity: "User",
      entityId: opts.userId,
      metadata: { notes: opts.notes },
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function verifyRecruiter(
  recruiterProfileId: string,
  verified: boolean,
): Promise<ActionResult> {
  const staff = await requireStaff();
  const profile = await prisma.recruiterProfile.update({
    where: { id: recruiterProfileId },
    data: { verified },
  });

  if (verified) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: profile.userId } });
    if (!user.roles.includes(Role.RECRUITER)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: [...user.roles, Role.RECRUITER] },
      });
    }
  }

  await prisma.moderationAction.create({
    data: {
      actorId: staff.id,
      targetType: "RecruiterProfile",
      targetId: profile.id,
      action: verified ? "VERIFY_RECRUITER" : "UNVERIFY_RECRUITER",
    },
  });

  revalidatePath("/admin/recruiters");
  return { ok: true };
}

export async function deletePostAsAdmin(postId: string): Promise<ActionResult> {
  const staff = await requireStaff();
  await prisma.post.update({
    where: { id: postId },
    data: { published: false },
  });
  await prisma.moderationAction.create({
    data: {
      actorId: staff.id,
      targetType: "Post",
      targetId: postId,
      action: "UNPUBLISH_POST",
    },
  });
  revalidatePath("/app/feed");
  return { ok: true };
}
