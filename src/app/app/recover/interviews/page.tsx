export const dynamic = "force-dynamic";

import { listInterviewNotes, deleteInterviewNote } from "@/actions/interviews";
import { InterviewForm } from "@/components/recover/interview-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ROUND: Record<string, string> = {
  SCREEN: "Screen",
  HIRING_MANAGER: "Hiring manager",
  PANEL: "Panel",
  ASSIGNMENT: "Assignment",
  OFFER: "Offer",
  OTHER: "Other",
};

const FEELING: Record<string, string> = {
  HOPEFUL: "Hopeful",
  MIXED: "Mixed",
  DRAINED: "Drained",
  UNSURE: "Unsure",
};

export default async function InterviewsPage() {
  const notes = await listInterviewNotes();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card>
            <h2 className="font-display text-xl text-coal">No notes yet</h2>
            <p className="mt-2 text-sm text-ash">
              After a round, dump it here while it’s still loud in your head. This is not a tracker
              for recruiters — it’s for you.
            </p>
          </Card>
        ) : (
          notes.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-coal">{n.company}</p>
                  <p className="text-sm text-ash">
                    {n.role ? `${n.role} · ` : ""}
                    {ROUND[n.round] ?? n.round}
                    {n.happenedAt ? ` · ${format(n.happenedAt, "MMM d")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {n.feeling ? <Badge>{FEELING[n.feeling] ?? n.feeling}</Badge> : null}
                  <form
                    action={async () => {
                      "use server";
                      await deleteInterviewNote(n.id);
                    }}
                  >
                    <Button type="submit" size="sm" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
              {n.wentWell ? (
                <p className="mt-3 text-sm text-ash">
                  <span className="font-semibold text-coal">Went well: </span>
                  {n.wentWell}
                </p>
              ) : null}
              {n.toImprove ? (
                <p className="mt-2 text-sm text-ash">
                  <span className="font-semibold text-coal">Next time: </span>
                  {n.toImprove}
                </p>
              ) : null}
              {n.askNext ? (
                <p className="mt-2 text-sm text-ash">
                  <span className="font-semibold text-coal">Ask: </span>
                  {n.askNext}
                </p>
              ) : null}
              {n.nextStep ? (
                <p className="mt-2 text-sm font-medium text-ember">{n.nextStep}</p>
              ) : null}
            </Card>
          ))
        )}
      </div>
      <Card className="h-fit lg:sticky lg:top-24">
        <h2 className="font-display text-xl">After a round</h2>
        <p className="mt-1 text-sm text-ash">Private. Write badly. You’ll thank yourself later.</p>
        <div className="mt-4">
          <InterviewForm />
        </div>
      </Card>
    </div>
  );
}
