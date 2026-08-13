export const dynamic = "force-dynamic";

import { getRecoverSnapshot } from "@/actions/recover";
import { KitList } from "@/components/recover/kit-list";
import { kitProgress } from "@/lib/kit";
import { Card } from "@/components/ui/card";

export default async function KitPage() {
  const { profile } = await getRecoverSnapshot();
  const progress = kitProgress(profile.kitCompletedIds);

  return (
    <Card>
      <p className="text-sm text-ash">
        {progress.done} of {progress.total} · {progress.percent}%
      </p>
      <h2 className="mt-1 font-display text-2xl text-coal">The first 72 hours</h2>
      <p className="mt-2 text-sm text-ash">
        Not a productivity challenge. Just the boring, protective stuff most people forget while
        the shock is still on.
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-parchment">
        <div
          className="h-full rounded-full bg-ember"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="mt-6">
        <KitList completed={profile.kitCompletedIds} />
      </div>
    </Card>
  );
}
