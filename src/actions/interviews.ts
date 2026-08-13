"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { interviewNoteSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

export async function addInterviewNote(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = interviewNoteSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role") || undefined,
    round: formData.get("round") || "OTHER",
    happenedAt: formData.get("happenedAt") || undefined,
    wentWell: formData.get("wentWell") || undefined,
    toImprove: formData.get("toImprove") || undefined,
    askNext: formData.get("askNext") || undefined,
    nextStep: formData.get("nextStep") || undefined,
    feeling: formData.get("feeling") || undefined,
    wantPeerEyes: formData.get("wantPeerEyes") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  await prisma.interviewNote.create({
    data: {
      userId: user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      round: parsed.data.round,
      happenedAt: parsed.data.happenedAt ? new Date(parsed.data.happenedAt) : null,
      wentWell: parsed.data.wentWell,
      toImprove: parsed.data.toImprove,
      askNext: parsed.data.askNext,
      nextStep: parsed.data.nextStep,
      feeling: parsed.data.feeling,
      wantPeerEyes: parsed.data.wantPeerEyes ?? false,
    },
  });

  revalidatePath("/app/recover/interviews");
  return { ok: true };
}

export async function deleteInterviewNote(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const note = await prisma.interviewNote.findUnique({ where: { id } });
  if (!note || note.userId !== user.id) {
    return { ok: false, error: "Note not found." };
  }
  await prisma.interviewNote.delete({ where: { id } });
  revalidatePath("/app/recover/interviews");
  return { ok: true };
}

export async function listInterviewNotes() {
  const user = await requireAuth();
  return prisma.interviewNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}
