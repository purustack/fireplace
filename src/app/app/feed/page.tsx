export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { listFeed } from "@/actions/posts";
import { CreatePostForm, FeedList, FeedHero } from "@/components/feed/feed";

export default async function FeedPage() {
  const session = await auth();
  const posts = await listFeed();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <FeedHero />
        <FeedList posts={posts} currentUserId={session!.user.id} />
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <CreatePostForm />
      </aside>
    </div>
  );
}
