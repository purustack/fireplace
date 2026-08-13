import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { usernameFromName } from "@/lib/utils";

type GoogleAccount = {
  provider: string;
  providerAccountId: string;
  type?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
};

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  account: GoogleAccount;
}) {
  const email = input.email.toLowerCase();
  const name = input.name?.trim() || email.split("@")[0] || "Member";

  let user = await prisma.user.findUnique({ where: { email } });
  if (user?.accountStatus === "SUSPENDED" || user?.accountStatus === "BANNED") {
    return null;
  }

  if (!user) {
    const base = usernameFromName(name);
    let username = base;
    let i = 0;
    while (await prisma.profile.findUnique({ where: { username } })) {
      i += 1;
      username = `${base}-${i}`;
    }

    user = await prisma.user.create({
      data: {
        email,
        name,
        image: input.image,
        roles: [Role.USER],
        emailVerified: new Date(),
        onboardingStep: 2,
        profile: {
          create: {
            username,
            profileCompleteness: 15,
          },
        },
        verification: {
          create: { personalEmailVerified: true },
        },
      },
    });
  } else if (!user.image && input.image) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { image: input.image },
    });
  }

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: input.account.providerAccountId,
      },
    },
    create: {
      userId: user.id,
      type: input.account.type ?? "oidc",
      provider: "google",
      providerAccountId: input.account.providerAccountId,
      access_token: input.account.access_token,
      refresh_token: input.account.refresh_token,
      expires_at: input.account.expires_at,
      token_type: input.account.token_type,
      scope: input.account.scope,
      id_token: input.account.id_token,
    },
    update: {
      userId: user.id,
      access_token: input.account.access_token,
      refresh_token: input.account.refresh_token,
      expires_at: input.account.expires_at,
      token_type: input.account.token_type,
      scope: input.account.scope,
      id_token: input.account.id_token,
    },
  });

  return user;
}
