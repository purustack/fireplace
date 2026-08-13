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

  if (storageKey.startsWith("verification/")) {
    if (!hasRole(session.user, Role.MODERATOR, Role.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (storageKey.startsWith("messages/")) {
    const conversationId = parts[1];
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });
    if (!participant && !hasRole(session.user, Role.MODERATOR, Role.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (storageKey.startsWith("resumes/")) {
    const ownerId = parts[1];
    const isOwner = ownerId === session.user.id;
    const isStaff = hasRole(session.user, Role.MODERATOR, Role.ADMIN);
    if (!isOwner && !isStaff) {
      const [accepted, sharedInChat] = await Promise.all([
        prisma.recruiterContactRequest.findFirst({
          where: {
            recruiterId: session.user.id,
            candidateId: ownerId,
            status: "ACCEPTED",
          },
        }),
        prisma.message.findFirst({
          where: {
            attachmentKey: storageKey,
            conversation: {
              participants: { some: { userId: session.user.id } },
            },
          },
        }),
      ]);
      if (!accepted && !sharedInChat) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const data = await storage.get(storageKey);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = parts[parts.length - 1] ?? "file";
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
