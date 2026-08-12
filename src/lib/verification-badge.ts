import type { VerificationDocStatus } from "@prisma/client";

type VerificationWithDocs = {
  layoffDocStatus: VerificationDocStatus;
  documents?: Array<{
    status: VerificationDocStatus;
    mimeType: string;
    fileName: string;
  }>;
} | null | undefined;

/**
 * Layoff Verified badge is only earned after a termination-letter PDF
 * was uploaded and approved by moderation. Status alone is not enough.
 */
export function hasLayoffVerifiedBadge(
  verification: VerificationWithDocs,
): boolean {
  if (!verification || verification.layoffDocStatus !== "VERIFIED") {
    return false;
  }

  return (verification.documents ?? []).some(
    (doc) =>
      doc.status === "VERIFIED" &&
      (doc.mimeType === "application/pdf" ||
        doc.fileName.toLowerCase().endsWith(".pdf")),
  );
}

export function hasLayoffDocumentSubmitted(
  verification: { documents?: Array<{ id: string }> } | null | undefined,
): boolean {
  return (verification?.documents?.length ?? 0) > 0;
}
