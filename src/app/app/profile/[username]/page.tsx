export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfileByUsername } from "@/actions/profile";
import { AvailabilityBadge, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasLayoffVerifiedBadge } from "@/lib/verification-badge";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const isOwner = session?.user?.id === profile.userId;
  if (!profile.user.publicProfile && !isOwner) notFound();

  const primary = profile.skills.filter((s) => s.type === "PRIMARY");
  const secondary = profile.skills.filter((s) => s.type === "SECONDARY");

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-coal">{profile.user.name}</h1>
            <p className="mt-1 text-lg text-ash">{profile.jobTitle}</p>
            <div className="mt-3">
              <AvailabilityBadge status={profile.layoffStatus} />
            </div>
            {profile.layoffStatus === "AVAILABLE_IMMEDIATELY" ? (
              <p className="mt-2 text-sm font-semibold text-success">Available Immediately</p>
            ) : profile.expectedAvailabilityDate ? (
              <p className="mt-2 text-sm text-ash">
                Available from{" "}
                {profile.expectedAvailabilityDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
          {isOwner ? (
            <Link href="/app/settings">
              <Button variant="secondary">Edit settings</Button>
            </Link>
          ) : (
            <Link href={`/app/messages?to=${profile.userId}`}>
              <Button>Message</Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-ash">
          {profile.yearsExperience != null ? (
            <span>{profile.yearsExperience} Years Experience</span>
          ) : null}
          {profile.user.showLocation && (profile.city || profile.country) ? (
            <span>
              📍 {[profile.city, profile.country].filter(Boolean).join(", ")}
            </span>
          ) : null}
          {profile.user.showPreviousCompany && profile.previousCompany ? (
            <span>Previously {profile.previousCompany}</span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.user.verification?.personalEmailVerified ? (
            <Badge tone="success">✓ Email Verified</Badge>
          ) : null}
          {profile.user.verification?.employmentEmailVerified ? (
            <Badge tone="success">✓ Employment Email Verified</Badge>
          ) : null}
          {hasLayoffVerifiedBadge(profile.user.verification) ? (
            <Badge tone="success">✓ Layoff Verified</Badge>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {primary.map((s) => (
              <Badge key={s.id} tone="ember">
                {s.skill.name}
              </Badge>
            ))}
            {secondary.map((s) => (
              <Badge key={s.id}>{s.skill.name}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Looking for</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ash">
            {profile.lookingFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      {profile.about ? (
        <Card>
          <h2 className="font-display text-xl">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ash">
            {profile.about}
          </p>
        </Card>
      ) : null}

      {profile.resume && isOwner ? (
        <Card>
          <h2 className="font-display text-xl">Resume</h2>
          <a
            className="mt-3 inline-block text-sm font-semibold text-ember"
            href={`/api/files/${profile.resume.storageKey}`}
          >
            View resume ({profile.resume.fileName})
          </a>
        </Card>
      ) : null}

      {profile.user.posts.length > 0 ? (
        <Card>
          <h2 className="font-display text-xl">Opportunities & posts</h2>
          <ul className="mt-3 space-y-2">
            {profile.user.posts.map((p) => (
              <li key={p.id} className="text-sm text-ash">
                <span className="font-medium text-coal">{p.title}</span> · {p.category}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
