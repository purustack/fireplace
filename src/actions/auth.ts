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

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Account created but sign-in failed. Please log in." };
    }
    throw error;
  }

  return { ok: true, data: { email } };
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
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
