export const dynamic = "force-dynamic";

import Link from "next/link";
import { getRecoverSnapshot } from "@/actions/recover";
import { RunwayForm } from "@/components/recover/runway-form";
import { buildWeekPlan, kitProgress } from "@/lib/kit";
import { Card } from "@/components/ui/card";

export default async function RunwayPage() {
  const { profile, weeksLeft, survey } = await getRecoverSnapshot();
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
    <div className="space-y-4">
      <Card>
        <h2 className="font-display text-2xl text-coal">How long the money lasts</h2>
        <p className="mt-2 text-sm text-ash">
          Two numbers. We turn them into weeks — not a judgment. Adjust anytime.
        </p>
        {weeksLeft != null ? (
          <p className="mt-4 font-display text-4xl text-coal">{weeksLeft} weeks</p>
        ) : (
          <p className="mt-4 text-sm font-medium text-ember">Add numbers to see weeks of runway.</p>
        )}
        <div className="mt-6">
          <RunwayForm
            savings={profile.runwaySavings}
            burn={profile.runwayMonthlyBurn}
            currency={profile.runwayCurrency}
          />
        </div>
      </Card>

      <Card className="border-ember/20 bg-gradient-to-br from-ember-soft/30 to-warm-white">
        <h2 className="font-display text-xl">What to do this week</h2>
        <ul className="mt-4 space-y-3">
          {plan.map((item) => (
            <li key={item.title}>
              <p className="font-semibold text-coal">{item.title}</p>
              <p className="text-sm text-ash">{item.why}</p>
              <Link href={item.href} className="text-sm font-semibold text-ember">
                Open →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
