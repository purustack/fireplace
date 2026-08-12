"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signOut } from "@/lib/auth";
import { signUpSchema } from "@/lib/validations";
import { usernameFromName } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

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

/** Creates the account only — client calls next-auth/react signIn afterward. */
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

    return { ok: true, data: { email } };
  } catch (error) {
    return { ok: false, error: dbErrorMessage(error) };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
