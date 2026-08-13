export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMessagingInbox } from "@/actions/messages";
import { MessagingClient } from "@/components/messaging/messaging";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; c?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const inbox = await getMessagingInbox();
  const existing = params.to
    ? inbox.conversations.find((c) =>
        c.participants.some((p) => p.user.id === params.to),
      )
    : null;

  const resume = await prisma.resume.findFirst({
    where: { profile: { userId: session!.user.id } },
    select: { id: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
          Private messages
        </p>
        <h1 className="mt-1 font-display text-3xl text-coal md:text-4xl">Inbox</h1>
        <p className="mt-2 max-w-2xl text-ash">
          Talk with peers and hiring contacts inside Fireplace. Share your resume in chat —
          personal emails and phone numbers stay private.
        </p>
      </div>
      <MessagingClient
        inbox={inbox}
        toUserId={existing ? undefined : params.to}
        initialConversationId={existing?.id ?? params.c}
        currentUserId={session!.user.id}
        hasResume={Boolean(resume)}
      />
    </div>
  );
}
