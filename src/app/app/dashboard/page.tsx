export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AvailabilityBadge, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasLayoffVerifiedBadge } from "@/lib/verification-badge";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: true,
      verification: {
        include: {
          documents: {
            select: {
              id: true,
              status: true,
              mimeType: true,
              fileName: true,
            },
          },
        },
      },
      notifications: { where: { readAt: null }, take: 5, orderBy: { createdAt: "desc" } },
      contactRequestsRecv: { where: { status: "PENDING" } },
      savedJobs: { take: 5, include: { post: true } },
    },
  });

  const profile = user.profile!;
  const layoffVerified = hasLayoffVerifiedBadge(user.verification);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-coal md:text-4xl">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-ash">
          You lost a job. You didn’t lose your career — here’s your home base.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-ash">Current status</p>
          <div className="mt-3">
            <AvailabilityBadge status={profile.layoffStatus} />
          </div>
          {profile.layoffStatus === "AVAILABLE_IMMEDIATELY" ? (
            <p className="mt-3 text-sm text-success">
              {user.recruiterVisibility
                ? "Your profile is currently visible to recruiters."
                : "Recruiter visibility is off."}
            </p>
          ) : profile.expectedAvailabilityDate ? (
            <p className="mt-3 text-sm text-ash">
              Available from{" "}
              {profile.expectedAvailabilityDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}
        </Card>

        <Card>
          <p className="text-sm text-ash">Profile completeness</p>
          <p className="mt-2 font-display text-3xl text-coal">
            {Math.min(100, profile.profileCompleteness)}%
          </p>
          <Link href={`/app/profile/${profile.username}`} className="mt-3 inline-block">
            <Button size="sm" variant="secondary">
              View profile
            </Button>
          </Link>
        </Card>

        <Card>
          <p className="text-sm text-ash">Verification</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.verification?.personalEmailVerified ? (
              <Badge tone="success">✓ Email Verified</Badge>
            ) : (
              <Badge>Email pending</Badge>
            )}
            {user.verification?.employmentEmailVerified ? (
              <Badge tone="success">✓ Employment Email</Badge>
            ) : null}
            {layoffVerified ? (
              <Badge tone="success">✓ Layoff Verified</Badge>
            ) : user.verification?.documents?.length ? (
              <Badge tone="warning">Layoff docs under review</Badge>
            ) : (
              <Badge tone="warning">Upload termination letter PDF</Badge>
            )}
          </div>
          <Link href="/onboarding/verification" className="mt-3 inline-block">
            <Button size="sm" variant="ghost">
              Improve trust signals
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Messages & requests</h2>
          <p className="mt-2 text-sm text-ash">
            {user.contactRequestsRecv.length} pending recruiter contact
            {user.contactRequestsRecv.length === 1 ? "" : "s"} ·{" "}
            {user.notifications.length} unread notification
            {user.notifications.length === 1 ? "" : "s"}
          </p>
          <Link href="/app/messages" className="mt-4 inline-block">
            <Button size="sm">Open inbox</Button>
          </Link>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Community</h2>
          <p className="mt-2 text-sm text-ash">
            Share opportunities, ask for referrals, or post a discussion.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/app/feed">
              <Button size="sm">Go to feed</Button>
            </Link>
            <Link href="/app/search">
              <Button size="sm" variant="secondary">
                Search people
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {user.savedJobs.length > 0 ? (
        <Card>
          <h2 className="font-display text-xl">Saved jobs</h2>
          <ul className="mt-4 space-y-2">
            {user.savedJobs.map((s) => (
              <li key={s.id} className="text-sm text-ash">
                <span className="font-medium text-coal">{s.post.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
