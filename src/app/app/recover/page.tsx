export const dynamic = "force-dynamic";

import Link from "next/link";
import { getRecoverSnapshot, getCompanyHearth } from "@/actions/recover";
import { listInterviewNotes } from "@/actions/interviews";
import { buildWeekPlan, kitProgress } from "@/lib/kit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, HeartHandshake, Timer, NotebookPen } from "lucide-react";

export default async function RecoverPage() {
  const [{ profile, weeksLeft, survey }, hearth, notes] = await Promise.all([
    getRecoverSnapshot(),
    getCompanyHearth(),
    listInterviewNotes(),
  ]);
  const kit = kitProgress(profile.kitCompletedIds);
  const plan = buildWeekPlan({
    kitDone: kit.done,
    kitTotal: kit.total,
    weeksLeft,
    supportNeeded: survey?.supportNeeded ?? [],
    hearthOptIn: profile.hearthOptIn,
    hasCompany: Boolean(profile.previousCompany),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/app/recover/kit">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-ember/30">
            <ClipboardList className="h-5 w-5 text-ember" />
            <p className="mt-3 text-sm text-ash">72-hour kit</p>
            <p className="font-display text-2xl text-coal">
              {kit.done}/{kit.total}
            </p>
          </Card>
        </Link>
        <Link href="/app/recover/runway">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-ember/30">
            <Timer className="h-5 w-5 text-ember" />
            <p className="mt-3 text-sm text-ash">Runway</p>
            <p className="font-display text-2xl text-coal">
              {weeksLeft == null ? "Add numbers" : `${weeksLeft} weeks`}
            </p>
          </Card>
        </Link>
        <Link href="/app/recover/hearth">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-ember/30">
            <HeartHandshake className="h-5 w-5 text-ember" />
            <p className="mt-3 text-sm text-ash">Company hearth</p>
            <p className="font-display text-2xl text-coal">
              {profile.hearthOptIn ? `${hearth.members.length} nearby` : "Opt in"}
            </p>
          </Card>
        </Link>
        <Link href="/app/recover/interviews">
          <Card className="h-full transition hover:-translate-y-0.5 hover:border-ember/30">
            <NotebookPen className="h-5 w-5 text-ember" />
            <p className="mt-3 text-sm text-ash">Interview notes</p>
            <p className="font-display text-2xl text-coal">{notes.length}</p>
          </Card>
        </Link>
      </div>

      <Card className="border-ember/20 bg-gradient-to-br from-ember-soft/40 to-warm-white">
        <h2 className="font-display text-xl text-coal">What to do this week</h2>
        <p className="mt-1 text-sm text-ash">
          Based on your kit, runway, and what you said would help. Not a hustle score.
        </p>
        <ul className="mt-4 space-y-3">
          {plan.map((item) => (
            <li key={item.title} className="rounded-2xl bg-warm-white/80 p-3">
              <p className="font-semibold text-coal">{item.title}</p>
              <p className="mt-1 text-sm text-ash">{item.why}</p>
              <Link href={item.href} className="mt-2 inline-block text-sm font-semibold text-ember">
                Open →
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/app/build">
          <Button variant="secondary">Build something with someone</Button>
        </Link>
        <Link href="/app/feed">
          <Button variant="ghost">Or just sit in the feed</Button>
        </Link>
      </div>
    </div>
  );
}
