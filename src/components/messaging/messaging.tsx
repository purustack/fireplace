"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  editMessage,
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
import { Check, FileText, Pencil, Paperclip, Send, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Inbox = Awaited<ReturnType<typeof getMessagingInbox>>;
type ConversationDetail = NonNullable<Awaited<ReturnType<typeof getConversation>>>;

const POLL_MS = 4000;
const LIVE_EVENT = "fireplace:messages";

export function MessagingClient({
  inbox: initialInbox,
  toUserId,
  toUserName,
  toUserImage,
  currentUserId,
  hasResume,
  initialConversationId,
}: {
  inbox: Inbox;
  toUserId?: string;
  toUserName?: string;
  toUserImage?: string | null;
  currentUserId: string;
  hasResume: boolean;
  initialConversationId?: string;
}) {
  const [pending, start] = useTransition();
  const [inbox, setInbox] = useState(initialInbox);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialConversationId ?? (toUserId ? undefined : initialInbox.conversations[0]?.id),
  );
  const [selectedOutgoingId, setSelectedOutgoingId] = useState<string | undefined>();
  const [thread, setThread] = useState<ConversationDetail | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState<string>();
  const [editingId, setEditingId] = useState<string>();
  const [editBody, setEditBody] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);
  const lastMessageId = thread?.messages.at(-1)?.id;
  const inboxStampRef = useRef<string>("");
  const outgoingTargetRef = useRef<string | undefined>(undefined);

  const alreadyMessaged = Boolean(
    toUserId &&
      inbox.conversations.some((c) => c.participants.some((p) => p.user.id === toUserId)),
  );
  const pendingToTarget = toUserId
    ? inbox.outgoingRequests.find((r) => r.to.id === toUserId)
    : undefined;
  const composingNew = Boolean(toUserId && !alreadyMessaged && !pendingToTarget && !requestSent);
  const selectedOutgoing = inbox.outgoingRequests.find((r) => r.id === selectedOutgoingId);

  useEffect(() => {
    if (!pendingToTarget) return;
    setRequestSent(true);
    setSelectedOutgoingId(pendingToTarget.id);
    outgoingTargetRef.current = pendingToTarget.to.id;
    setSelectedId(undefined);
    setThread(null);
  }, [pendingToTarget?.id]);

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
          nextInbox.outgoingRequests.map((r) => r.id).join("|"),
          nextInbox.contactRequests.map((r) => r.id).join("|"),
        ].join("/");
        if (stamp !== inboxStampRef.current) {
          const first = inboxStampRef.current === "";
          inboxStampRef.current = stamp;
          if (!first) notifyMessagesChanged();
        }

        if (selectedOutgoingId) {
          const stillPending = nextInbox.outgoingRequests.some((r) => r.id === selectedOutgoingId);
          if (!stillPending) {
            const targetId = outgoingTargetRef.current;
            const accepted = targetId
              ? nextInbox.conversations.find((c) =>
                  c.participants.some((p) => p.user.id === targetId),
                )
              : undefined;
            outgoingTargetRef.current = undefined;
            setSelectedOutgoingId(undefined);
            if (accepted) {
              setSelectedId(accepted.id);
              const data = await getConversation(accepted.id);
              if (!cancelled) setThread(data);
              return;
            }
          } else if (!cancelled) {
            setThread(null);
          }
          return;
        }

        if (composingNew) {
          if (!cancelled) setThread(null);
          return;
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
  }, [selectedId, selectedOutgoingId, composingNew]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  const other = thread?.participants.find((p) => p.user.id !== currentUserId)?.user;
  const lastOwnMessageId = thread?.messages.findLast(
    (message) => message.senderId === currentUserId,
  )?.id;
  const showCompose = composingNew && !selectedOutgoing;
  const emptyInbox =
    inbox.conversations.length === 0 && inbox.outgoingRequests.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto">
        <h2 className="font-display text-lg">Inbox</h2>
        {inbox.outgoingRequests.map((r) => {
          const active = selectedOutgoing?.id === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedOutgoingId(r.id);
                outgoingTargetRef.current = r.to.id;
                setSelectedId(undefined);
                setThread(null);
              }}
              className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                active ? "bg-ember-soft ring-1 ring-ember/20" : "hover:bg-parchment"
              }`}
            >
              <Avatar name={r.to.name} image={r.to.image} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block truncate font-semibold text-coal">{r.to.name}</span>
                  <Badge tone="warning" className="shrink-0">
                    Pending
                  </Badge>
                </span>
                <span className="block truncate text-xs text-ash">{r.initialMessage}</span>
              </span>
            </button>
          );
        })}
        {inbox.conversations.map((c) => {
          const person = c.participants.find((p) => p.user.id !== currentUserId)?.user;
          const active = c.id === selectedId && !selectedOutgoing;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedId(c.id);
                setSelectedOutgoingId(undefined);
                outgoingTargetRef.current = undefined;
              }}
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
        {emptyInbox ? (
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
                          const next = await getMessagingInbox();
                          setInbox(next);
                          const opened = next.conversations.find((c) =>
                            c.participants.some((p) => p.user.id === r.from.id),
                          );
                          if (opened) {
                            setSelectedOutgoingId(undefined);
                            setSelectedId(opened.id);
                            setThread(await getConversation(opened.id));
                          }
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

        {selectedOutgoing ? (
          <Card className="border-ember/20 bg-gradient-to-br from-ember-soft/40 to-warm-white">
            <div className="flex items-center gap-3">
              <Avatar name={selectedOutgoing.to.name} image={selectedOutgoing.to.image} />
              <div>
                <p className="font-display text-xl text-coal">{selectedOutgoing.to.name}</p>
                <p className="text-xs text-ash">
                  {selectedOutgoing.to.profile?.jobTitle ?? "Fireplace member"}
                </p>
              </div>
              <Badge tone="warning" className="ml-auto">
                Awaiting reply
              </Badge>
            </div>
            <p className="mt-4 rounded-2xl bg-warm-white/80 px-4 py-3 text-sm text-ash">
              {selectedOutgoing.initialMessage}
            </p>
            <p className="mt-3 text-sm text-ash">
              Request sent. You’ll chat here after they accept — this stays in your inbox as pending.
            </p>
          </Card>
        ) : null}

        {showCompose ? (
          <Card className="border-ember/20 bg-gradient-to-br from-ember-soft/40 to-warm-white">
            <div className="flex items-center gap-3">
              <Avatar name={toUserName ?? "Member"} image={toUserImage} />
              <div>
                <h2 className="font-display text-xl">{toUserName ?? "Start a conversation"}</h2>
                <p className="text-sm text-ash">
                  They’ll receive a request first. You’ll see them in your inbox as pending until they accept.
                </p>
              </div>
            </div>
            <form
              className="mt-4 space-y-3"
              action={(fd) =>
                start(async () => {
                  const res = await sendMessageRequest(fd);
                  if (!res.ok) setError(res.error);
                  else {
                    setError(undefined);
                    setRequestSent(true);
                    setSelectedId(undefined);
                    setThread(null);
                    notifyMessagesChanged();
                    const next = await getMessagingInbox();
                    setInbox(next);
                    const sent = next.outgoingRequests.find((r) => r.to.id === toUserId);
                    if (sent) {
                      setSelectedOutgoingId(sent.id);
                      outgoingTargetRef.current = sent.to.id;
                    }
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
          </Card>
        ) : null}

        {thread && !selectedOutgoing && !showCompose ? (
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
                const editing = editingId === m.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`group max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        mine
                          ? "rounded-br-md bg-ember text-warm-white"
                          : "rounded-bl-md bg-warm-white text-coal"
                      }`}
                    >
                      {editing ? (
                        <div className="flex min-w-60 items-center gap-2">
                          <Input
                            value={editBody}
                            onChange={(event) => setEditBody(event.target.value)}
                            maxLength={5000}
                            autoFocus
                            className="h-9 bg-warm-white text-coal"
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                setEditingId(undefined);
                                setEditBody("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            aria-label="Save edited message"
                            disabled={pending || !editBody.trim()}
                            className="rounded-lg p-1.5 hover:bg-warm-white/15 disabled:opacity-40"
                            onClick={() =>
                              start(async () => {
                                const res = await editMessage(m.id, editBody);
                                if (!res.ok) {
                                  setError(res.error);
                                  return;
                                }
                                setError(undefined);
                                setEditingId(undefined);
                                setEditBody("");
                                setThread(await getConversation(thread.id));
                                notifyMessagesChanged();
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel editing"
                            className="rounded-lg p-1.5 hover:bg-warm-white/15"
                            onClick={() => {
                              setEditingId(undefined);
                              setEditBody("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                          {mine ? (
                            <button
                              type="button"
                              aria-label="Edit message"
                              className="shrink-0 rounded-md p-1 opacity-60 transition hover:bg-warm-white/15 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              onClick={() => {
                                setEditingId(m.id);
                                setEditBody(m.body);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                      )}
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
                        {m.editedAt ? " · edited" : ""}
                        {mine && m.id === lastOwnMessageId ? ` · ${m.readAt ? "Seen" : "Sent"}` : ""}
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
        ) : !toUserId && !selectedOutgoing && !thread ? (
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
