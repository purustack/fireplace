export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCompanyHearth } from "@/actions/recover";
import { HearthOptIn } from "@/components/recover/hearth-opt-in";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityBadge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

export default async function HearthPage() {
  const { me, members } = await getCompanyHearth();
  const company = me.previousCompany;

  return (
    <div className="space-y-4">
      <Card className="border-ember/20">
        <h2 className="font-display text-2xl text-coal">
          {company ? `People from ${company}` : "Same-company hearth"}
        </h2>
        <p className="mt-2 text-sm text-ash">
          Opt in to see others who listed the same last company and also opted in. This is not a
          public directory. Recruiters cannot search it.
        </p>
        {!company ? (
          <p className="mt-4 rounded-xl bg-warning/10 px-3 py-2 text-sm text-coal">
            Add your previous company in professional onboarding / profile first.
          </p>
        ) : (
          <div className="mt-4">
            <HearthOptIn optedIn={me.hearthOptIn} />
          </div>
        )}
      </Card>

      {me.hearthOptIn && company ? (
        members.length === 0 ? (
          <Card>
            <p className="font-display text-xl text-coal">You’re first here</p>
            <p className="mt-2 text-sm text-ash">
              When someone else from {company} opts in, they’ll show up here. You can still message
              people from the feed.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <Card key={m.userId}>
                <div className="flex items-start gap-3">
                  <Avatar name={m.user.name} image={m.user.image} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-coal">{m.user.name}</p>
                    <p className="text-sm text-ash">{m.jobTitle ?? "Fireplace member"}</p>
                    <div className="mt-2">
                      <AvailabilityBadge status={m.layoffStatus} compact />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.user.profile?.username ? (
                        <Link href={`/app/profile/${m.user.profile.username}`}>
                          <Button size="sm" variant="secondary">
                            Profile
                          </Button>
                        </Link>
                      ) : null}
                      <Link href={`/app/messages?to=${m.user.id}`}>
                        <Button size="sm">
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
