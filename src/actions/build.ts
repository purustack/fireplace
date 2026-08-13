"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { buildIdeaSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

export async function createBuildIdea(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const skills = String(formData.get("requiredSkills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = buildIdeaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requiredSkills: skills,
    lookingFor: formData.get("lookingFor") || undefined,
    compensationType: formData.get("compensationType") || "EQUITY",
    workPreference: formData.get("workPreference") || "REMOTE",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid idea." };
  }

  await prisma.startupIdea.create({
    data: {
      authorId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      requiredSkills: parsed.data.requiredSkills,
      lookingFor: parsed.data.lookingFor,
      compensationType: parsed.data.compensationType,
      workPreference: parsed.data.workPreference,
      status: "OPEN",
    },
  });

  revalidatePath("/app/build");
  return { ok: true };
}

export async function expressBuildInterest(
  ideaId: string,
  note?: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const idea = await prisma.startupIdea.findUnique({ where: { id: ideaId } });
  if (!idea) return { ok: false, error: "Idea not found." };
  if (idea.authorId === user.id) {
    return { ok: false, error: "That’s your own idea." };
  }

  await prisma.startupCollaborator.upsert({
    where: { ideaId_userId: { ideaId, userId: user.id } },
    create: { ideaId, userId: user.id, note: note?.slice(0, 500), status: "PENDING" },
    update: { note: note?.slice(0, 500), status: "PENDING" },
  });

  await prisma.notification.create({
    data: {
      userId: idea.authorId,
      type: "BUILD_INTEREST",
      title: "Someone wants to build with you",
      body: `${user.name.split(" ")[0]} is interested in “${idea.title}”.`,
      href: "/app/build",
    },
  });

  revalidatePath("/app/build");
  return { ok: true };
}

export async function respondBuildInterest(
  joinId: string,
  decision: "ACCEPTED" | "DECLINED",
): Promise<ActionResult> {
  const user = await requireAuth();
  const join = await prisma.startupCollaborator.findUnique({
    where: { id: joinId },
    include: { idea: true },
  });
  if (!join || join.idea.authorId !== user.id) {
    return { ok: false, error: "Request not found." };
  }

  await prisma.startupCollaborator.update({
    where: { id: joinId },
    data: { status: decision },
  });

  revalidatePath("/app/build");
  return { ok: true };
}

export async function listBuildIdeas() {
  await requireAuth();
  return prisma.startupIdea.findMany({
    where: { status: { not: "PAUSED" } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { username: true, jobTitle: true } },
        },
      },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
}
