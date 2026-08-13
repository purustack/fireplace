export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { setUserModerationStatus } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRIVATE_PROFILE_OMIT } from "@/lib/profile-privacy";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      profile: { omit: PRIVATE_PROFILE_OMIT },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Users</h1>
      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search users…"
          className="h-11 w-full max-w-md rounded-xl border border-smoke/40 bg-warm-white px-3"
        />
      </form>
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-coal">{u.name}</p>
              <p className="text-sm text-ash">
                {u.email} · {u.profile?.jobTitle ?? "No title"} · {u.roles.join(", ")}
              </p>
              <Badge className="mt-2">{u.accountStatus}</Badge>
            </div>
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await setUserModerationStatus({
                    userId: u.id,
                    status: "SUSPENDED",
                    notes: "Suspended from admin panel",
                  });
                }}
              >
                <Button size="sm" variant="secondary" type="submit">
                  Suspend
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await setUserModerationStatus({
                    userId: u.id,
                    status: "VERIFIED",
                    notes: "Restored from admin panel",
                  });
                }}
              >
                <Button size="sm" type="submit">
                  Restore
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
