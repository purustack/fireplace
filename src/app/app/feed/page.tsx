export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { listFeed } from "@/actions/posts";
import { CreatePostForm, FeedList } from "@/components/feed/feed";

export default async function FeedPage() {
  const session = await auth();
  const posts = await listFeed();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-coal">Community feed</h1>
          <p className="mt-2 text-ash">
            Opportunities, referrals, advice, and support from people rebuilding together.
          </p>
        </div>
        <FeedList posts={posts} currentUserId={session!.user.id} />
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <CreatePostForm />
      </aside>
    </div>
  );
}
