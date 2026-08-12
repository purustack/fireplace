"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signIn, signOut } from "@/lib/auth";
import { signUpSchema } from "@/lib/validations";
import { usernameFromName } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function dbErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/DATABASE_URL|Can't reach|P1001|P1017|timeout|ECONNREFUSED/i.test(message)) {
    return "Database connection failed. Check DATABASE_URL on Vercel.";
  }
  if (/Unique constraint|P2002/i.test(message)) {
    return "An account with this email already exists.";
  }
  console.error("[Fireplace] DB/auth error:", error);
  return "Something went wrong creating your account. Please try again.";
}

export async function registerUser(formData: FormData): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    country: formData.get("country"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const email = parsed.data.email.toLowerCase();
  const limit = rateLimit(`signup:${email}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Too many signup attempts. Try again later." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const base = usernameFromName(parsed.data.name);
    let username = base;
    let i = 0;
    while (await prisma.profile.findUnique({ where: { username } })) {
      i += 1;
      username = `${base}-${i}`;
    }

    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        roles: [Role.USER],
        emailVerified: new Date(),
        onboardingStep: 2,
        profile: {
          create: {
            username,
            city: parsed.data.city,
            country: parsed.data.country,
            profileCompleteness: 15,
          },
        },
        verification: {
          create: {
            personalEmailVerified: true,
          },
        },
      },
    });
  } catch (error) {
    return { ok: false, error: dbErrorMessage(error) };
  }

  try {
    // redirectTo sets the session cookie via Next.js redirect (required on Vercel).
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/onboarding/professional",
    });
    return { ok: true, data: { email } };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) {
      return {
        ok: false,
        error: "Account created but sign-in failed. Please log in.",
      };
    }
    console.error("[Fireplace] signIn after register:", error);
    return {
      ok: false,
      error: "Account created but sign-in failed. Please log in.",
    };
  }
}

export async function loginUser(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const limit = rateLimit(`login:${email}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Too many login attempts. Try again later." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/app/dashboard",
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    console.error("[Fireplace] login error:", error);
    return { ok: false, error: "Sign-in failed. Please try again." };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
