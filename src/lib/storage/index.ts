import { randomUUID } from "crypto";
import { createLocalStorage } from "./local";
import type { StorageAdapter, StoredFile } from "./types";

const ALLOWED_RESUME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Termination / layoff letters: PDF only */
const ALLOWED_VERIFICATION = new Set(["application/pdf"]);

const ALLOWED_AVATAR = new Set(["image/jpeg", "image/png"]);

const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);

function getAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    return createLocalStorage(process.env.STORAGE_LOCAL_PATH ?? "./storage");
  }
  // Production: plug S3-compatible adapter here without changing callers.
  return createLocalStorage(process.env.STORAGE_LOCAL_PATH ?? "./storage");
}

export const storage = getAdapter();

export async function storeUpload(opts: {
  file: File;
  prefix: string;
  kind: "resume" | "verification" | "avatar";
}): Promise<StoredFile> {
  const { file, prefix, kind } = opts;
  if (file.size > MAX_BYTES) {
    throw new Error(`File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)}MB limit.`);
  }

  const allowed =
    kind === "resume"
      ? ALLOWED_RESUME
      : kind === "verification"
        ? ALLOWED_VERIFICATION
        : ALLOWED_AVATAR;

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (kind === "verification" && !looksLikePdf) {
    throw new Error("Termination letters must be uploaded as a PDF.");
  }

  if (!allowed.has(file.type) && !(kind === "verification" && looksLikePdf)) {
    throw new Error(
      kind === "verification"
        ? "Termination letters must be uploaded as a PDF."
        : "Unsupported file type.",
    );
  }

  const ext =
    kind === "verification"
      ? "pdf"
      : file.name.split(".").pop()?.toLowerCase() || "bin";
  const storageKey = `${prefix}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType =
    kind === "verification" ? "application/pdf" : file.type || "application/octet-stream";
  await storage.put(storageKey, buffer, mimeType);

  return {
    storageKey,
    fileName: file.name.toLowerCase().endsWith(".pdf")
      ? file.name
      : kind === "verification"
        ? `${file.name}.pdf`
        : file.name,
    mimeType,
    sizeBytes: file.size,
  };
}
