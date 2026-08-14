import { randomUUID } from "crypto";
import { createLocalStorage } from "./local";
import type { StorageAdapter, StoredFile } from "./types";
import { prisma } from "@/lib/db";

const ALLOWED_RESUME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Termination / layoff letters: PDF only */
const ALLOWED_VERIFICATION = new Set(["application/pdf"]);

const ALLOWED_AVATAR = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);

function getLocalAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  // Vercel’s filesystem is ephemeral — use /tmp for MVP free hosting.
  const defaultPath = process.env.VERCEL
    ? "/tmp/fireplace-storage"
    : "./storage";
  if (driver === "local") {
    return createLocalStorage(process.env.STORAGE_LOCAL_PATH ?? defaultPath);
  }
  return createLocalStorage(process.env.STORAGE_LOCAL_PATH ?? defaultPath);
}

const localStorage = getLocalAdapter();

/**
 * Keep a local cache for development, but persist the source of truth in
 * Postgres so uploads survive serverless instance changes on Vercel.
 */
export const storage: StorageAdapter = {
  async put(key, data, mimeType) {
    const bytes = new Uint8Array(data.byteLength);
    bytes.set(data);
    await prisma.storedFileBlob.upsert({
      where: { storageKey: key },
      create: { storageKey: key, data: bytes, mimeType },
      update: { data: bytes, mimeType },
    });
    await localStorage.put(key, data, mimeType);
  },
  async get(key) {
    const cached = await localStorage.get(key);
    if (cached) return cached;

    const stored = await prisma.storedFileBlob.findUnique({
      where: { storageKey: key },
      select: { data: true },
    });
    if (!stored) return null;

    const data = Buffer.from(stored.data);
    await localStorage.put(key, data, "application/octet-stream");
    return data;
  },
  async delete(key) {
    await Promise.all([
      localStorage.delete(key),
      prisma.storedFileBlob.deleteMany({ where: { storageKey: key } }),
    ]);
  },
  async exists(key) {
    if (await localStorage.exists(key)) return true;
    return Boolean(
      await prisma.storedFileBlob.findUnique({
        where: { storageKey: key },
        select: { storageKey: true },
      }),
    );
  },
};

export async function storeUpload(opts: {
  file: File;
  prefix: string;
  kind: "resume" | "verification" | "avatar";
}): Promise<StoredFile> {
  const { file, prefix, kind } = opts;
  const sizeLimit = kind === "avatar" ? MAX_AVATAR_BYTES : MAX_BYTES;
  if (file.size > sizeLimit) {
    throw new Error(
      kind === "avatar"
        ? "Profile photo must be under 2MB."
        : `File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  const allowed =
    kind === "resume"
      ? ALLOWED_RESUME
      : kind === "verification"
        ? ALLOWED_VERIFICATION
        : ALLOWED_AVATAR;

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const looksLikeAvatar =
    ALLOWED_AVATAR.has(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);

  if (kind === "verification" && !looksLikePdf) {
    throw new Error("Termination letters must be uploaded as a PDF.");
  }

  if (kind === "avatar" && !looksLikeAvatar) {
    throw new Error("Profile photo must be a JPG, PNG, or WebP.");
  }

  if (!allowed.has(file.type) && !(kind === "verification" && looksLikePdf) && kind !== "avatar") {
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
    kind === "verification"
      ? "application/pdf"
      : kind === "avatar"
        ? avatarMime(file)
        : file.type || "application/octet-stream";
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

function avatarMime(file: File) {
  if (ALLOWED_AVATAR.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
