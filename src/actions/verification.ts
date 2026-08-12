"use server";

import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth, requireStaff } from "@/lib/rbac";
import { employmentEmailSchema, otpSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { storeUpload } from "@/lib/storage";
import { VerificationDocStatus } from "@prisma/client";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export async function requestEmploymentEmailOtp(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = employmentEmailSchema.safeParse({
    employmentEmail: formData.get("employmentEmail"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid employment email." };
  }

  const limit = rateLimit(`emp-otp:${user.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "OTP limit reached. Try again in an hour." };
  }

  const otp = String(randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verification.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      employmentEmail: parsed.data.employmentEmail.toLowerCase(),
      employmentEmailOtpHash: hashOtp(otp),
      employmentEmailOtpExpires: expires,
    },
    update: {
      employmentEmail: parsed.data.employmentEmail.toLowerCase(),
      employmentEmailOtpHash: hashOtp(otp),
      employmentEmailOtpExpires: expires,
      employmentEmailVerified: false,
    },
  });

  // Dev: OTP logged server-side — never expose employment email publicly.
  console.info(`[Fireplace] Employment email OTP for user ${user.id}: ${otp}`);

  return { ok: true };
}

export async function confirmEmploymentEmailOtp(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = otpSchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) {
    return { ok: false, error: "Enter the 6-digit OTP." };
  }

  const verification = await prisma.verification.findUnique({
    where: { userId: user.id },
  });

  if (
    !verification?.employmentEmailOtpHash ||
    !verification.employmentEmailOtpExpires ||
    verification.employmentEmailOtpExpires < new Date()
  ) {
    return { ok: false, error: "OTP expired. Request a new one." };
  }

  if (verification.employmentEmailOtpHash !== hashOtp(parsed.data.otp)) {
    return { ok: false, error: "Incorrect OTP." };
  }

  await prisma.verification.update({
    where: { userId: user.id },
    data: {
      employmentEmailVerified: true,
      employmentEmailOtpHash: null,
      employmentEmailOtpExpires: null,
    },
  });

  revalidatePath("/app/profile");
  return { ok: true };
}

export async function uploadLayoffDocument(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth();
  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please upload a PDF of your termination letter." };
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return { ok: false, error: "Termination letters must be a PDF from your organisation." };
  }

  const limit = rateLimit(`layoff-doc:${user.id}`, 5, 24 * 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Document upload limit reached for today." };
  }

  try {
    const stored = await storeUpload({
      file,
      prefix: `verification/${user.id}`,
      kind: "verification",
    });

    const verification = await prisma.verification.upsert({
      where: { userId: user.id },
      create: { userId: user.id, layoffDocStatus: VerificationDocStatus.PENDING },
      update: { layoffDocStatus: VerificationDocStatus.PENDING },
    });

    await prisma.verificationDocument.create({
      data: {
        verificationId: verification.id,
        storageKey: stored.storageKey,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        status: VerificationDocStatus.PENDING,
      },
    });

    revalidatePath("/onboarding/verification");
    revalidatePath("/admin/verifications");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function reviewLayoffDocument(opts: {
  documentId: string;
  decision: "VERIFIED" | "REJECTED";
  notes?: string;
}): Promise<ActionResult> {
  const staff = await requireStaff();

  const doc = await prisma.verificationDocument.findUnique({
    where: { id: opts.documentId },
    include: { verification: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };

  await prisma.$transaction([
    prisma.verificationDocument.update({
      where: { id: doc.id },
      data: {
        status: opts.decision,
        reviewedById: staff.id,
        reviewedAt: new Date(),
        reviewNotes: opts.notes,
      },
    }),
    prisma.verification.update({
      where: { id: doc.verificationId },
      data: { layoffDocStatus: opts.decision },
    }),
    prisma.moderationAction.create({
      data: {
        actorId: staff.id,
        targetType: "VerificationDocument",
        targetId: doc.id,
        action: opts.decision === "VERIFIED" ? "VERIFY_LAYOFF" : "REJECT_LAYOFF",
        notes: opts.notes,
      },
    }),
    prisma.notification.create({
      data: {
        userId: doc.verification.userId,
        type:
          opts.decision === "VERIFIED"
            ? "VERIFICATION_APPROVED"
            : "VERIFICATION_REJECTED",
        title:
          opts.decision === "VERIFIED"
            ? "Layoff verification approved"
            : "Layoff verification needs attention",
        body:
          opts.decision === "VERIFIED"
            ? "Your layoff documentation was verified."
            : opts.notes ?? "Please review and resubmit documentation.",
        href: "/app/settings",
      },
    }),
  ]);

  revalidatePath("/admin/verifications");
  return { ok: true };
}
