import { Role, ModerationStatus, type User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = "UNAUTHORIZED",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  accountStatus: ModerationStatus;
  image?: string | null;
};

export function hasRole(user: { roles: Role[] }, ...roles: Role[]): boolean {
  return roles.some((r) => user.roles.includes(r));
}

export function isStaff(user: { roles: Role[] }): boolean {
  return hasRole(user, Role.MODERATOR, Role.ADMIN);
}

export function isActiveAccount(status: ModerationStatus): boolean {
  return status !== ModerationStatus.SUSPENDED && status !== ModerationStatus.BANNED;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("You must be signed in.", "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
      accountStatus: true,
      image: true,
    },
  });

  if (!user) {
    throw new AuthError("Account not found.", "UNAUTHORIZED");
  }

  if (!isActiveAccount(user.accountStatus)) {
    throw new AuthError("Your account is suspended or banned.", "FORBIDDEN");
  }

  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasRole(user, ...roles)) {
    throw new AuthError("You do not have permission for this action.", "FORBIDDEN");
  }
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  return requireRole(Role.MODERATOR, Role.ADMIN);
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(Role.ADMIN);
}

export async function requireOnboarded(): Promise<SessionUser & { onboardingStep: number }> {
  const user = await requireAuth();
  const full = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { onboardingStep: true },
  });
  if (full.onboardingStep < 4) {
    throw new AuthError("Please complete onboarding first.", "ONBOARDING_REQUIRED");
  }
  return { ...user, onboardingStep: full.onboardingStep };
}

export function assertOwnership(resourceUserId: string, actor: User | SessionUser) {
  if (resourceUserId !== actor.id && !hasRole(actor, Role.ADMIN, Role.MODERATOR)) {
    throw new AuthError("You do not own this resource.", "FORBIDDEN");
  }
}
