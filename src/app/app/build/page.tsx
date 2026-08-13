export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { listBuildIdeas } from "@/actions/build";
import { CreateIdeaForm, JoinIdeaButton, IdeaRequestActions } from "@/components/build/build-forms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const COMP: Record<string, string> = {
  EQUITY: "Equity / sweat",
  PAID: "Paid if it works",
  VOLUNTEER: "Just building",
  EQUITY_AND_PAID: "Equity + paid",
};

export default async function BuildPage() {
  const session = await auth();
  const me = session!.user.id;
  const ideas = await listBuildIdeas();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
          Build together
        </p>
        <h1 className="mt-1 font-display text-3xl text-coal md:text-4xl">
          You have time and a skill. Someone else does too.
        </h1>
        <p className="mt-2 max-w-2xl text-ash">
          Not a startup marketplace. A table for people between jobs who want to ship something
          small — a tool, a demo, a messy prototype.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {ideas.length === 0 ? (
            <Card>
              <p className="font-display text-xl">Nothing on the table yet</p>
              <p className="mt-2 text-sm text-ash">Put a half-formed idea up. That’s the point.</p>
            </Card>
          ) : (
            ideas.map((idea) => {
              const mine = idea.authorId === me;
              const myJoin = idea.collaborators.find((c) => c.userId === me);
              const pending = idea.collaborators.filter((c) => c.status === "PENDING");
              const accepted = idea.collaborators.filter((c) => c.status === "ACCEPTED");
              return (
                <Card key={idea.id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={idea.author.name} image={idea.author.image} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-coal">{idea.author.name}</p>
                      <p className="text-xs text-ash">{idea.author.profile?.jobTitle ?? "Member"}</p>
                    </div>
                    <Badge>{COMP[idea.compensationType] ?? idea.compensationType}</Badge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl text-coal">{idea.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ash">{idea.description}</p>
                  {idea.lookingFor ? (
                    <p className="mt-2 text-sm font-medium text-ember">{idea.lookingFor}</p>
                  ) : null}
                  {idea.requiredSkills.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {idea.requiredSkills.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {accepted.length > 0 ? (
                    <p className="mt-3 text-xs text-ash">
                      Building with {accepted.map((c) => c.user.name).join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-4">
                    {mine ? (
                      pending.length ? (
                        <div className="space-y-2 rounded-2xl bg-parchment p-3">
                          <p className="text-sm font-semibold text-coal">People interested</p>
                          {pending.map((c) => (
                            <div key={c.id}>
                              <p className="text-sm text-ash">
                                <span className="font-semibold text-coal">{c.user.name}</span>
                                {c.note ? ` — ${c.note}` : ""}
                              </p>
                              <IdeaRequestActions joinId={c.id} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-ash">Waiting for a co-builder.</p>
                      )
                    ) : myJoin ? (
                      <Badge tone={myJoin.status === "ACCEPTED" ? "success" : "warning"}>
                        {myJoin.status === "ACCEPTED" ? "You’re in" : "Interest sent"}
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <JoinIdeaButton ideaId={idea.id} />
                        {idea.author.profile?.username ? (
                          <Link href={`/app/profile/${idea.author.profile.username}`}>
                            <Button size="sm" variant="secondary">
                              Their profile
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
        <Card className="h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Put an idea down</h2>
          <p className="mt-1 text-sm text-ash">Half-baked is welcome. Recruiters don’t browse this.</p>
          <div className="mt-4">
            <CreateIdeaForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
