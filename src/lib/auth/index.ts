import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import type { Role, ModerationStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      roles: Role[];
      accountStatus: ModerationStatus;
      onboardingStep: number;
    };
  }

  interface User {
    roles?: Role[];
    accountStatus?: ModerationStatus;
    onboardingStep?: number;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      if (user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED") {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: user.roles,
        accountStatus: user.accountStatus,
        onboardingStep: user.onboardingStep,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }) as never,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.roles = user.roles;
        token.accountStatus = user.accountStatus;
        token.onboardingStep = user.onboardingStep;
      }

      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.onboardingStep = session.onboardingStep ?? token.onboardingStep;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            roles: true,
            accountStatus: true,
            onboardingStep: true,
            name: true,
            email: true,
            image: true,
          },
        });
        if (dbUser) {
          token.roles = dbUser.roles;
          token.accountStatus = dbUser.accountStatus;
          token.onboardingStep = dbUser.onboardingStep;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roles = (token.roles as Role[]) ?? ["USER"];
        session.user.accountStatus =
          (token.accountStatus as ModerationStatus) ?? "VERIFIED";
        session.user.onboardingStep = (token.onboardingStep as number) ?? 1;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },
  trustHost: true,
});
