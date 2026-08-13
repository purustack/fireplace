"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createPost, addComment, toggleReaction, toggleSavePost, updateJobStatus } from "@/actions/posts";
import { createReport } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge, AvailabilityBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Heart, Bookmark, Flag, MessageCircle, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import type { JobPostStatus, PostCategory } from "@prisma/client";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "JOB_OPPORTUNITY", label: "💼 Job Opportunity" },
  { value: "REFERRAL", label: "🤝 Referral" },
  { value: "STARTUP_IDEA", label: "🚀 Startup Idea" },
  { value: "DISCUSSION", label: "💡 Discussion" },
  { value: "LEARNING", label: "📚 Learning" },
  { value: "CAREER_ADVICE", label: "🎯 Career Advice" },
  { value: "NEED_HELP", label: "🆘 Need Help" },
  { value: "SUCCESS_STORY", label: "🎉 Success Story" },
];

type FeedPost = {
  id: string;
  title: string;
  body: string;
  category: PostCategory;
  jobStatus: JobPostStatus | null;
  jobMeta: unknown;
  createdAt: Date | string;
  authorId: string;
  author: {
    id: string;
    name: string;
    image?: string | null;
    profile: {
      username: string;
      jobTitle: string | null;
      layoffStatus: "SERVING_NOTICE" | "AVAILABLE_IMMEDIATELY";
    } | null;
  };
  comments: Array<{
    id: string;
    body: string;
    author: { name: string };
  }>;
  _count: { comments: number; reactions: number; savedBy: number };
};

function jobMetaFields(meta: unknown) {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as {
    experienceRange?: string;
    skills?: string[];
    location?: string;
    company?: string;
  };
  return m;
}

export function CreatePostForm() {
  const [category, setCategory] = useState<PostCategory>("DISCUSSION");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card className="overflow-hidden border-ember/20 bg-gradient-to-b from-warm-white to-ember-soft/30">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-warm-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-xl leading-tight">Share with the hearth</h2>
          <p className="text-xs text-ash">Opportunities, ideas, and support.</p>
        </div>
      </div>
      <form
        className="space-y-3"
        action={(fd) => {
          start(async () => {
            const res = await createPost(fd);
            if (!res.ok) setError(res.error);
            else {
              setError(undefined);
              (document.getElementById("create-post-form") as HTMLFormElement | null)?.reset();
            }
          });
        }}
        id="create-post-form"
      >
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required minLength={5} placeholder="What’s happening?" />
        </div>
        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea id="body" name="body" required minLength={10} placeholder="Share details the community can act on…" />
        </div>
        {category === "JOB_OPPORTUNITY" ? (
          <div className="grid gap-3 rounded-xl border border-ember/20 bg-warm-white/80 p-3 md:grid-cols-2">
            <Input name="experienceRange" placeholder="Experience e.g. 3–6 years" />
            <Input name="jobLocation" placeholder="Location e.g. Remote" />
            <Input name="jobSkills" placeholder="Skills (comma-separated)" className="md:col-span-2" />
            <Input name="jobCompany" placeholder="Company (optional)" className="md:col-span-2" />
          </div>
        ) : null}
        <FieldError>{error}</FieldError>
        <Button disabled={pending} className="w-full">
          {pending ? "Posting…" : "Publish to feed"}
        </Button>
      </form>
    </Card>
  );
}

export function FeedList({
  posts,
  currentUserId,
}: {
  posts: FeedPost[];
  currentUserId: string;
}) {
  const [pending, start] = useTransition();

  if (posts.length === 0) {
    return (
      <Card className="py-14 text-center">
        <p className="font-display text-2xl text-coal">The hearth is quiet</p>
        <p className="mt-2 text-ash">Be the first to share an opportunity or discussion.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => {
        const cat = CATEGORIES.find((c) => c.value === post.category);
        const isJob = post.category === "JOB_OPPORTUNITY";
        const meta = jobMetaFields(post.jobMeta);
        const username = post.author.profile?.username;
        const profileHref = username ? `/app/profile/${username}` : undefined;
        const messageHref =
          post.authorId !== currentUserId ? `/app/messages?to=${post.authorId}` : undefined;

        return (
          <article
            key={post.id}
            className={
              isJob
                ? "rounded-3xl border border-ember/30 bg-gradient-to-br from-ember-soft/70 via-warm-white to-warm-white p-5 shadow-sm ring-1 ring-ember/10 transition hover:-translate-y-0.5 hover:shadow-md"
                : "rounded-3xl border border-smoke/25 bg-warm-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {profileHref ? (
                  <Link href={profileHref} className="shrink-0">
                    <Avatar name={post.author.name} image={post.author.image} />
                  </Link>
                ) : (
                  <Avatar name={post.author.name} image={post.author.image} />
                )}
                <div className="min-w-0">
                  {profileHref ? (
                    <Link href={profileHref} className="font-semibold text-coal hover:text-ember">
                      {post.author.name}
                    </Link>
                  ) : (
                    <p className="font-semibold text-coal">{post.author.name}</p>
                  )}
                  <p className="truncate text-xs text-ash">
                    {post.author.profile?.jobTitle ?? "Fireplace member"}
                    {" · "}
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge tone={isJob ? "ember" : "neutral"}>{cat?.label ?? post.category}</Badge>
                {post.author.profile ? (
                  <AvailabilityBadge status={post.author.profile.layoffStatus} compact />
                ) : null}
              </div>
            </div>

            <h3 className="mt-4 font-display text-2xl leading-snug text-coal">{post.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ash">{post.body}</p>

            {isJob && meta ? (
              <div className="mt-4 grid gap-2 rounded-xl bg-warm-white/70 p-3 text-sm sm:grid-cols-2">
                {meta.company ? (
                  <p>
                    <span className="font-semibold text-coal">Company: </span>
                    {meta.company}
                  </p>
                ) : null}
                {meta.experienceRange ? (
                  <p>
                    <span className="font-semibold text-coal">Experience: </span>
                    {meta.experienceRange}
                  </p>
                ) : null}
                {meta.location ? (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-ember" />
                    {meta.location}
                  </p>
                ) : null}
                {meta.skills?.length ? (
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-coal">Skills: </span>
                    {meta.skills.join(" · ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {isJob && post.jobStatus ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    post.jobStatus === "OPEN"
                      ? "success"
                      : post.jobStatus === "CLOSED"
                        ? "neutral"
                        : "warning"
                  }
                >
                  {post.jobStatus.replaceAll("_", " ")}
                </Badge>
                {post.authorId === currentUserId ? (
                  <Select
                    className="h-9 w-auto"
                    defaultValue={post.jobStatus}
                    disabled={pending}
                    onChange={(e) =>
                      start(async () => {
                        await updateJobStatus(post.id, e.target.value as JobPostStatus);
                      })
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="HIRING_IN_PROGRESS">Hiring in progress</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {profileHref ? (
                <Link href={profileHref}>
                  <Button size="sm" variant={isJob ? "primary" : "secondary"}>
                    <ArrowUpRight className="h-4 w-4" />
                    View profile
                  </Button>
                </Link>
              ) : null}
              {messageHref ? (
                <Link href={messageHref}>
                  <Button size="sm" variant={isJob ? "secondary" : "outline"}>
                    <MessageCircle className="h-4 w-4" />
                    {isJob ? "Message about this role" : "Message"}
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-1 border-t border-smoke/20 pt-3">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await toggleReaction(post.id); })}
              >
                <Heart className="h-4 w-4" /> {post._count.reactions}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await toggleSavePost(post.id); })}
              >
                <Bookmark className="h-4 w-4" /> {post._count.savedBy}
              </Button>
              <span className="inline-flex items-center gap-1 px-3 text-sm text-ash">
                <MessageCircle className="h-4 w-4" /> {post._count.comments}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  start(async () => {
                    const fd = new FormData();
                    fd.set("targetType", "POST");
                    fd.set("targetId", post.id);
                    fd.set("reason", "SPAM");
                    fd.set("details", "Reported from feed");
                    await createReport(fd);
                  })
                }
              >
                <Flag className="h-4 w-4" /> Report
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {post.comments.map((c) => (
                <p key={c.id} className="rounded-lg bg-parchment/80 px-3 py-2 text-sm text-ash">
                  <span className="font-semibold text-coal">{c.author.name}</span>
                  <span className="mx-1.5 text-smoke">·</span>
                  {c.body}
                </p>
              ))}
              <form
                className="flex gap-2"
                action={(fd) => {
                  start(async () => {
                    await addComment(fd);
                  });
                }}
              >
                <input type="hidden" name="postId" value={post.id} />
                <Input name="body" placeholder="Add a comment…" required className="h-10" />
                <Button size="sm" type="submit" disabled={pending}>
                  Reply
                </Button>
              </form>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function FeedHero() {
  return (
    <div className="overflow-hidden rounded-3xl bg-coal px-6 py-7 text-warm-white shadow-lg">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember">
          <Briefcase className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember-soft">
            Community feed
          </p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">What’s next starts here</h1>
          <p className="mt-2 max-w-xl text-sm text-warm-white/75">
            Open roles, referrals, and conversations from people rebuilding together.
            Tap a name to open their profile — or message them directly.
          </p>
        </div>
      </div>
    </div>
  );
}
