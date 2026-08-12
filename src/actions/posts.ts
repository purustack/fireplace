"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { createPostSchema, commentSchema } from "@/lib/validations";
import { JobPostStatus, PostCategory, ReactionType } from "@prisma/client";
import type { ActionResult } from "./auth";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();

  const skillsRaw = String(formData.get("jobSkills") ?? "");
  const jobMeta =
    formData.get("category") === "JOB_OPPORTUNITY"
      ? {
          experienceRange: String(formData.get("experienceRange") ?? "") || undefined,
          skills: skillsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          location: String(formData.get("jobLocation") ?? "") || undefined,
          company: String(formData.get("jobCompany") ?? "") || undefined,
        }
      : undefined;

  const parsed = createPostSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    jobStatus:
      formData.get("category") === "JOB_OPPORTUNITY" ? "OPEN" : undefined,
    jobMeta,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." };
  }

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      category: parsed.data.category as PostCategory,
      title: parsed.data.title,
      body: parsed.data.body,
      jobStatus: parsed.data.jobStatus as JobPostStatus | undefined,
      jobMeta: parsed.data.jobMeta,
    },
  });

  revalidatePath("/app/feed");
  return { ok: true, data: { id: post.id } };
}

export async function updateJobStatus(
  postId: string,
  status: JobPostStatus,
): Promise<ActionResult> {
  const user = await requireAuth();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== user.id) {
    return { ok: false, error: "Post not found." };
  }
  if (post.category !== "JOB_OPPORTUNITY") {
    return { ok: false, error: "Not a job opportunity post." };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { jobStatus: status },
  });

  revalidatePath("/app/feed");
  return { ok: true };
}

export async function addComment(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid comment." };
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorId: user.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId,
    },
  });

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId } });
  if (post && post.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "NEW_COMMENT",
        title: "New comment on your post",
        body: parsed.data.body.slice(0, 120),
        href: `/app/feed#${post.id}`,
      },
    });
  }

  revalidatePath("/app/feed");
  return { ok: true };
}

export async function toggleReaction(postId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { postId, userId: user.id, type: ReactionType.LIKE },
    });
  }

  revalidatePath("/app/feed");
  return { ok: true };
}

export async function toggleSavePost(postId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const existing = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedPost.create({ data: { userId: user.id, postId } });
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post?.category === "JOB_OPPORTUNITY") {
      await prisma.savedJob.upsert({
        where: { userId_postId: { userId: user.id, postId } },
        create: { userId: user.id, postId },
        update: {},
      });
    }
  }

  revalidatePath("/app/feed");
  return { ok: true };
}

export async function listFeed(opts?: { category?: PostCategory; cursor?: string }) {
  await requireAuth();
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(opts?.category ? { category: opts.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    ...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { username: true, jobTitle: true, layoffStatus: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 5,
        include: {
          author: { select: { id: true, name: true, profile: { select: { username: true } } } },
        },
      },
      reactions: true,
      _count: { select: { comments: true, reactions: true, savedBy: true } },
    },
  });

  return posts;
}
