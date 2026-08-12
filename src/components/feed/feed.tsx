"use client";

import { useState, useTransition } from "react";
import { createPost, addComment, toggleReaction, toggleSavePost, updateJobStatus } from "@/actions/posts";
import { createReport } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge, AvailabilityBadge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
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
    profile: { username: string; jobTitle: string | null; layoffStatus: "SERVING_NOTICE" | "AVAILABLE_IMMEDIATELY" } | null;
  };
  comments: Array<{
    id: string;
    body: string;
    author: { name: string };
  }>;
  _count: { comments: number; reactions: number; savedBy: number };
};

export function CreatePostForm() {
  const [category, setCategory] = useState<PostCategory>("DISCUSSION");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card>
      <h2 className="font-display text-xl">Share with the community</h2>
      <form
        className="mt-4 space-y-3"
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
          <Input id="title" name="title" required minLength={5} />
        </div>
        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea id="body" name="body" required minLength={10} />
        </div>
        {category === "JOB_OPPORTUNITY" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="experienceRange" placeholder="Experience e.g. 3–6 years" />
            <Input name="jobLocation" placeholder="Location e.g. Remote" />
            <Input name="jobSkills" placeholder="Skills (comma-separated)" className="md:col-span-2" />
            <Input name="jobCompany" placeholder="Company (optional)" className="md:col-span-2" />
          </div>
        ) : null}
        <FieldError>{error}</FieldError>
        <Button disabled={pending}>{pending ? "Posting…" : "Post"}</Button>
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
      <Card>
        <p className="text-ash">No posts yet. Be the first to share an opportunity or discussion.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const label = CATEGORIES.find((c) => c.value === post.category)?.label ?? post.category;
        return (
          <Card key={post.id} className="space-y-4" >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="ember">{label}</Badge>
                <h3 className="mt-2 font-display text-xl text-coal">{post.title}</h3>
                <p className="mt-1 text-sm text-ash">
                  {post.author.name}
                  {post.author.profile?.jobTitle ? ` · ${post.author.profile.jobTitle}` : ""}
                  {" · "}
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
              {post.author.profile ? (
                <AvailabilityBadge status={post.author.profile.layoffStatus} compact />
              ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-coal">{post.body}</p>
            {post.category === "JOB_OPPORTUNITY" && post.jobStatus ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={post.jobStatus === "OPEN" ? "success" : post.jobStatus === "CLOSED" ? "neutral" : "warning"}>
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
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await toggleReaction(post.id); })}
              >
                ♥ {post._count.reactions}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await toggleSavePost(post.id); })}
              >
                Save · {post._count.savedBy}
              </Button>
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
                Report
              </Button>
            </div>
            <div className="space-y-2 border-t border-smoke/30 pt-3">
              {post.comments.map((c) => (
                <p key={c.id} className="text-sm text-ash">
                  <span className="font-semibold text-coal">{c.author.name}</span>: {c.body}
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
                <Input name="body" placeholder="Write a comment…" required className="h-10" />
                <Button size="sm" type="submit" disabled={pending}>
                  Reply
                </Button>
              </form>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
