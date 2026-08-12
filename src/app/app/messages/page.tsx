export const dynamic = "force-dynamic";

import { getMessagingInbox } from "@/actions/messages";
import { MessagingClient } from "@/components/messaging/messaging";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const params = await searchParams;
  const inbox = await getMessagingInbox();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-coal">Messages</h1>
        <p className="mt-2 text-ash">
          Accept requests, talk with peers, and respond to verified recruiters — without exposing personal contact details.
        </p>
      </div>
      <MessagingClient inbox={inbox} toUserId={params.to} />
    </div>
  );
}
