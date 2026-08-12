"use client";

import { useTransition } from "react";
import {
  respondMessageRequest,
  sendMessage,
  sendMessageRequest,
} from "@/actions/messages";
import { respondContactRequest } from "@/actions/recruit";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Inbox = Awaited<ReturnType<typeof import("@/actions/messages").getMessagingInbox>>;

export function MessagingClient({
  inbox,
  toUserId,
}: {
  inbox: Inbox;
  toUserId?: string;
}) {
  const [pending, start] = useTransition();
  const active = inbox.conversations[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="space-y-3">
        <h2 className="font-display text-lg">Inbox</h2>
        {inbox.conversations.map((c) => {
          const other = c.participants.find((p) => p.user.name)?.user;
          return (
            <div key={c.id} className="rounded-xl bg-parchment px-3 py-2 text-sm">
              <p className="font-semibold text-coal">{other?.name ?? "Conversation"}</p>
              <p className="truncate text-ash">{c.messages[0]?.body}</p>
            </div>
          );
        })}
        {inbox.conversations.length === 0 ? (
          <p className="text-sm text-ash">No conversations yet.</p>
        ) : null}
      </Card>

      <div className="space-y-4">
        {inbox.requests.length > 0 ? (
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Message requests</h2>
            {inbox.requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-smoke/30 p-3">
                <p className="text-sm font-semibold">{r.from.name}</p>
                <p className="mt-1 text-sm text-ash">{r.initialMessage}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => start(async () => { await respondMessageRequest(r.id, "ACCEPTED"); })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => start(async () => { await respondMessageRequest(r.id, "REJECTED"); })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        ) : null}

        {inbox.contactRequests.length > 0 ? (
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Recruiter contact requests</h2>
            {inbox.contactRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-smoke/30 p-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{r.recruiter.name}</p>
                  {r.recruiter.recruiterProfile?.verified ? (
                    <Badge tone="success">✓ Verified Recruiter</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-ash">{r.recruiter.recruiterProfile?.companyName}</p>
                <p className="mt-1 text-sm text-ash">{r.message}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => start(async () => { await respondContactRequest(r.id, "ACCEPTED"); })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => start(async () => { await respondContactRequest(r.id, "DECLINED"); })}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        ) : null}

        {toUserId ? (
          <Card>
            <h2 className="font-display text-lg">Send a message request</h2>
            <form
              className="mt-3 space-y-3"
              action={(fd) => start(async () => { await sendMessageRequest(fd); })}
            >
              <input type="hidden" name="toId" value={toUserId} />
              <Textarea name="initialMessage" required placeholder="Introduce yourself…" />
              <Button disabled={pending}>Send request</Button>
            </form>
          </Card>
        ) : null}

        {active ? (
          <Card>
            <h2 className="font-display text-lg">Conversation</h2>
            <p className="mt-2 text-sm text-ash">{active.messages[0]?.body}</p>
            <form
              className="mt-4 flex gap-2"
              action={(fd) => start(async () => { await sendMessage(fd); })}
            >
              <input type="hidden" name="conversationId" value={active.id} />
              <Input name="body" required placeholder="Write a message…" />
              <Button disabled={pending}>Send</Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
