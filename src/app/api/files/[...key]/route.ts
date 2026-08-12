import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { hasRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

type Params = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: parts } = await params;
  const storageKey = parts.join("/");

  // Verification docs: staff only
  if (storageKey.startsWith("verification/")) {
    if (!hasRole(session.user, Role.MODERATOR, Role.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Resumes: owner or staff; recruiters only after accepted contact (simplified: owner/staff)
  if (storageKey.startsWith("resumes/")) {
    const ownerId = parts[1];
    const isOwner = ownerId === session.user.id;
    const isStaff = hasRole(session.user, Role.MODERATOR, Role.ADMIN);
    if (!isOwner && !isStaff) {
      const accepted = await prisma.recruiterContactRequest.findFirst({
        where: {
          recruiterId: session.user.id,
          candidateId: ownerId,
          status: "ACCEPTED",
        },
      });
      if (!accepted) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const data = await storage.get(storageKey);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
