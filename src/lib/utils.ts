import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function usernameFromName(name: string, suffix?: string): string {
  const base = slugify(name) || "member";
  return suffix ? `${base}-${suffix}` : base;
}

export function formatAvailabilityLabel(
  status: "SERVING_NOTICE" | "AVAILABLE_IMMEDIATELY",
): string {
  return status === "AVAILABLE_IMMEDIATELY"
    ? "Laid Off — Available Immediately"
    : "Laid Off — Serving Notice Period";
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
