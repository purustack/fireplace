import { NextResponse } from "next/server";

/**
 * Safe config probe for production debugging.
 * Does not expose secret values — only whether required env vars are present.
 */
export async function GET() {
  const authSecret = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
  const databaseUrl = Boolean(process.env.DATABASE_URL);
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || null;

  return NextResponse.json({
    ok: authSecret && databaseUrl,
    env: {
      AUTH_SECRET: authSecret,
      DATABASE_URL: databaseUrl,
      AUTH_URL: authUrl,
      NEXT_PUBLIC_APP_URL: appUrl,
    },
  });
}
