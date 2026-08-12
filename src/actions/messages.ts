"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { messageRequestSchema, sendMessageSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

async function isBlocked(a: string, b: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return Boolean(block);
}

export async function sendMessageRequest(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = messageRequestSchema.safeParse({
    toId: formData.get("toId"),
    initialMessage: formData.get("initialMessage"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid message." };
  }

  if (parsed.data.toId === user.id) {
    return { ok: false, error: "You cannot message yourself." };
  }

  if (await isBlocked(user.id, parsed.data.toId)) {
    return { ok: false, error: "Unable to message this user." };
  }

  const recipient = await prisma.user.findUnique({ where: { id: parsed.data.toId } });
  if (!recipient) return { ok: false, error: "User not found." };

  if (recipient.allowMessages === "VERIFIED_RECRUITERS") {
    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { userId: user.id },
    });
    if (!recruiter?.verified) {
      return { ok: false, error: "This user only accepts messages from verified recruiters." };
    }
  }

  const limit = rateLimit(`msg-req:${user.id}`, 30, 24 * 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Daily message request limit reached." };
  }

  await prisma.messageRequest.create({
    data: {
      fromId: user.id,
      toId: parsed.data.toId,
      initialMessage: parsed.data.initialMessage,
    },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.toId,
      type: "NEW_MESSAGE",
      title: "New message request",
      body: parsed.data.initialMessage.slice(0, 120),
      href: "/app/messages",
    },
  });

  revalidatePath("/app/messages");
  return { ok: true };
}

export async function respondMessageRequest(
  requestId: string,
  decision: "ACCEPTED" | "REJECTED",
): Promise<ActionResult> {
  const user = await requireAuth();
  const req = await prisma.messageRequest.findUnique({ where: { id: requestId } });
  if (!req || req.toId !== user.id) {
    return { ok: false, error: "Request not found." };
  }

  await prisma.messageRequest.update({
    where: { id: requestId },
    data: { status: decision },
  });

  if (decision === "ACCEPTED") {
    await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.fromId }, { userId: req.toId }],
        },
        messages: {
          create: {
            senderId: req.fromId,
            body: req.initialMessage,
          },
        },
      },
    });
  }

  revalidatePath("/app/messages");
  return { ok: true };
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid message." };
  }

  const limit = rateLimit(`msg:${user.id}`, 100, 60 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Messaging rate limit exceeded." };
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: parsed.data.conversationId,
        userId: user.id,
      },
    },
  });
  if (!participant) {
    return { ok: false, error: "Conversation not found." };
  }

  await prisma.message.create({
    data: {
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      body: parsed.data.body,
    },
  });

  await prisma.conversation.update({
    where: { id: parsed.data.conversationId },
    data: { updatedAt: new Date() },
  });

  const others = await prisma.conversationParticipant.findMany({
    where: {
      conversationId: parsed.data.conversationId,
      userId: { not: user.id },
    },
  });

  await prisma.notification.createMany({
    data: others.map((o) => ({
      userId: o.userId,
      type: "NEW_MESSAGE" as const,
      title: "New message",
      body: parsed.data.body.slice(0, 120),
      href: "/app/messages",
    })),
  });

  revalidatePath("/app/messages");
  return { ok: true };
}

export async function blockUser(userId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (userId === user.id) return { ok: false, error: "Invalid." };

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
    create: { blockerId: user.id, blockedId: userId },
    update: {},
  });

  return { ok: true };
}

export async function getMessagingInbox() {
  const user = await requireAuth();

  const [conversations, requests, contactRequests] = await Promise.all([
    prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                profile: { select: { username: true } },
              },
            },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.messageRequest.findMany({
      where: { toId: user.id, status: "PENDING" },
      include: {
        from: {
          select: { id: true, name: true, profile: { select: { username: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recruiterContactRequest.findMany({
      where: { candidateId: user.id, status: "PENDING" },
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            recruiterProfile: { select: { companyName: true, verified: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { conversations, requests, contactRequests };
}
