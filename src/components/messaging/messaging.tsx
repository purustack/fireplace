"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  getConversation,
  getMessagingInbox,
  respondMessageRequest,
  sendMessage,
  sendMessageRequest,
} from "@/actions/messages";
import { respondContactRequest } from "@/actions/recruit";
import { notifyMessagesChanged } from "@/components/messaging/live-message-badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UnreadBadge } from "@/components/ui/unread-badge";
import { FileText, Paperclip, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Inbox = Awaited<ReturnType<typeof getMessagingInbox>>;
type ConversationDetail = NonNullable<Awaited<ReturnType<typeof getConversation>>>;

const POLL_MS = 4000;
const LIVE_EVENT = "fireplace:messages";

export function MessagingClient({
  inbox: initialInbox,
  toUserId,
  currentUserId,
  hasResume,
  initialConversationId,
}: {
  inbox: Inbox;
  toUserId?: string;
  currentUserId: string;
  hasResume: boolean;
  initialConversationId?: string;
}) {
  const [pending, start] = useTransition();
  const [inbox, setInbox] = useState(initialInbox);
  const [selectedId, setSelectedId] = useState(
    initialConversationId ?? initialInbox.conversations[0]?.id,
  );
  const [thread, setThread] = useState<ConversationDetail | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string>();
  const threadEndRef = useRef<HTMLDivElement>(null);
  const lastMessageId = thread?.messages.at(-1)?.id;
  const inboxStampRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const nextInbox = await getMessagingInbox();
        if (cancelled) return;
        setInbox(nextInbox);

        const stamp = [
          nextInbox.conversations
            .map((c) => `${c.id}:${c.messages[0]?.id}:${c._count.messages}`)
            .join("|"),
          nextInbox.requests.map((r) => r.id).join("|"),
          nextInbox.contactRequests.map((r) => r.id).join("|"),
        ].join("/");
        if (stamp !== inboxStampRef.current) {
          const first = inboxStampRef.current === "";
          inboxStampRef.current = stamp;
          if (!first) notifyMessagesChanged();
        }

        const openId = selectedId ?? nextInbox.conversations[0]?.id;
        if (!selectedId && openId) setSelectedId(openId);

        if (openId) {
          const data = await getConversation(openId);
          if (!cancelled) setThread(data);
        } else if (!cancelled) {
          setThread(null);
        }
      } catch {
        /* ignore network blips */
      }
    }

    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener(LIVE_EVENT, onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(LIVE_EVENT, onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  const other = thread?.participants.find((p) => p.user.id !== currentUserId)?.user;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto">
        <h2 className="font-display text-lg">Inbox</h2>
        {inbox.conversations.map((c) => {
          const person = c.participants.find((p) => p.user.id !== currentUserId)?.user;
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                active ? "bg-ember-soft ring-1 ring-ember/20" : "hover:bg-parchment"
              }`}
            >
              <span className="relative">
                <Avatar name={person?.name ?? "Member"} image={person?.image} size="sm" />
                <UnreadBadge count={c._count.messages} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-coal">
                  {person?.name ?? "Conversation"}
                </span>
                <span className="block truncate text-xs text-ash">{c.messages[0]?.body}</span>
              </span>
            </button>
          );
        })}
        {inbox.conversations.length === 0 ? (
          <p className="text-sm text-ash">No conversations yet. Message someone from the feed.</p>
        ) : null}
      </Card>

      <div className="space-y-4">
        {inbox.requests.length > 0 ? (
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Message requests</h2>
            {inbox.requests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-smoke/30 p-3">
                <Avatar name={r.from.name} image={r.from.image} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.from.name}</p>
                  <p className="mt-1 text-sm text-ash">{r.initialMessage}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await respondMessageRequest(r.id, "ACCEPTED");
                          notifyMessagesChanged();
                          setInbox(await getMessagingInbox());
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await respondMessageRequest(r.id, "REJECTED");
                          notifyMessagesChanged();
                          setInbox(await getMessagingInbox());
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ) : null}

        {inbox.contactRequests.length > 0 ? (
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Recruiter contact requests</h2>
            {inbox.contactRequests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-smoke/30 p-3">
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
                    onClick={() =>
                      start(async () => {
                        await respondContactRequest(r.id, "ACCEPTED");
                        notifyMessagesChanged();
                        setInbox(await getMessagingInbox());
                      })
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await respondContactRequest(r.id, "DECLINED");
                        notifyMessagesChanged();
                        setInbox(await getMessagingInbox());
                      })
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        ) : null}

        {toUserId && !inbox.conversations.some((c) =>
          c.participants.some((p) => p.user.id === toUserId),
        ) ? (
          <Card className="border-ember/20 bg-gradient-to-br from-ember-soft/40 to-warm-white">
            <h2 className="font-display text-xl">Start a conversation</h2>
            <p className="mt-1 text-sm text-ash">
              They’ll receive a request first. Attach context — then share your resume once they accept.
            </p>
            {requestSent ? (
              <p className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
                Request sent. You’ll chat here after they accept.
              </p>
            ) : (
              <form
                className="mt-4 space-y-3"
                action={(fd) =>
                  start(async () => {
                    const res = await sendMessageRequest(fd);
                    if (!res.ok) setError(res.error);
                    else {
                      setRequestSent(true);
                      setError(undefined);
                      notifyMessagesChanged();
                    }
                  })
                }
              >
                <input type="hidden" name="toId" value={toUserId} />
                <Textarea
                  name="initialMessage"
                  required
                  placeholder="Hi — I saw your job post and I’m interested. Here’s a quick intro…"
                />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button disabled={pending}>Send message request</Button>
              </form>
            )}
          </Card>
        ) : null}

        {thread ? (
          <Card className="flex min-h-[28rem] flex-col p-0">
            <div className="flex items-center justify-between gap-3 border-b border-smoke/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={other?.name ?? "Member"} image={other?.image} />
                <div>
                  {other?.profile?.username ? (
                    <Link
                      href={`/app/profile/${other.profile.username}`}
                      className="font-display text-lg text-coal hover:text-ember"
                    >
                      {other.name}
                    </Link>
                  ) : (
                    <p className="font-display text-lg text-coal">{other?.name ?? "Conversation"}</p>
                  )}
                  <p className="text-xs text-ash">{other?.profile?.jobTitle ?? "Fireplace member"}</p>
                </div>
              </div>
              {other?.profile?.username ? (
                <Link href={`/app/profile/${other.profile.username}`}>
                  <Button size="sm" variant="secondary">
                    View profile
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-parchment/50 px-4 py-4">
              {thread.messages.map((m) => {
                const mine = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        mine
                          ? "rounded-br-md bg-ember text-warm-white"
                          : "rounded-bl-md bg-warm-white text-coal"
                      }`}
                    >
                      {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                      {m.attachmentKey ? (
                        <a
                          href={`/api/files/${m.attachmentKey}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2 flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold ${
                            mine ? "bg-warm-white/15" : "bg-ember-soft text-ember-deep"
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          {m.attachmentName ?? "Resume"}
                          {m.attachmentSize
                            ? ` · ${Math.max(1, Math.round(m.attachmentSize / 1024))} KB`
                            : ""}
                        </a>
                      ) : null}
                      <p className={`mt-1 text-[10px] ${mine ? "text-warm-white/70" : "text-ash"}`}>
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            <form
              className="space-y-2 border-t border-smoke/20 p-4"
              action={(fd) =>
                start(async () => {
                  const res = await sendMessage(fd);
                  if (!res.ok) setError(res.error);
                  else {
                    setError(undefined);
                    notifyMessagesChanged();
                    const [data, nextInbox] = await Promise.all([
                      getConversation(thread.id),
                      getMessagingInbox(),
                    ]);
                    setThread(data);
                    setInbox(nextInbox);
                    (document.getElementById("chat-composer") as HTMLFormElement | null)?.reset();
                  }
                })
              }
              id="chat-composer"
            >
              <input type="hidden" name="conversationId" value={thread.id} />
              <div className="flex gap-2">
                <Input name="body" placeholder="Write a message…" className="h-11" />
                <Button type="submit" disabled={pending} size="icon" aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-smoke/30 bg-warm-white px-3 py-2 text-ash hover:border-ember/40 hover:text-coal">
                  <Paperclip className="h-4 w-4" />
                  Attach resume PDF
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                  />
                </label>
                {hasResume ? (
                  <label className="inline-flex items-center gap-2 text-ash">
                    <input type="checkbox" name="shareExistingResume" className="accent-[var(--ember)]" />
                    Share resume from my profile
                  </label>
                ) : (
                  <Link href="/onboarding/professional" className="text-xs font-semibold text-ember">
                    Add a resume to your profile →
                  </Link>
                )}
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </form>
          </Card>
        ) : !toUserId ? (
          <Card className="flex min-h-72 items-center justify-center text-center">
            <div>
              <p className="font-display text-2xl text-coal">Pick a conversation</p>
              <p className="mt-2 text-sm text-ash">Or message someone from a job post in the feed.</p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
