import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { hasRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

type Params = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  const { key: parts } = await params;
  const storageKey = parts.join("/");
  const isAvatar = storageKey.startsWith("avatars/");

  if (!isAvatar && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (storageKey.startsWith("verification/")) {
    if (!session?.user || !hasRole(session.user, Role.MODERATOR, Role.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (storageKey.startsWith("messages/")) {
    const conversationId = parts[1];
    const participant = session?.user
      ? await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: session.user.id,
            },
          },
        })
      : null;
    if (!participant && !(session?.user && hasRole(session.user, Role.MODERATOR, Role.ADMIN))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (storageKey.startsWith("resumes/")) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mimeFor(filename),
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": isAvatar ? "public, max-age=86400" : "private, no-store",
    },
  });
}

function mimeFor(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
