"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLayoffStatus } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function LayoffForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"AVAILABLE_IMMEDIATELY" | "SERVING_NOTICE">(
    "AVAILABLE_IMMEDIATELY",
  );
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-ember">
        Step 3 of 4
      </p>
      <h1 className="mt-2 font-display text-3xl text-coal">Layoff status</h1>
      <p className="mt-2 text-sm text-ash">
        Fireplace is for people who were laid off or terminated due to workforce
        reduction — not voluntary resignations.
      </p>
      <form
        className="mt-6 space-y-4"
        action={(fd) => {
          start(async () => {
            const res = await saveLayoffStatus(fd);
            if (!res.ok) setError(res.error);
            else router.push("/onboarding/verification");
          });
        }}
      >
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">What is your current status?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-smoke/40 bg-parchment p-4">
            <input
              type="radio"
              name="layoffStatus"
              value="AVAILABLE_IMMEDIATELY"
              checked={status === "AVAILABLE_IMMEDIATELY"}
              onChange={() => setStatus("AVAILABLE_IMMEDIATELY")}
              className="mt-1"
            />
            <span>
              <span className="font-semibold text-coal">🟢 Laid Off — Available Immediately</span>
              <span className="mt-1 block text-sm text-ash">
                Employment has ended and you can join right away.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-smoke/40 bg-parchment p-4">
            <input
              type="radio"
              name="layoffStatus"
              value="SERVING_NOTICE"
              checked={status === "SERVING_NOTICE"}
              onChange={() => setStatus("SERVING_NOTICE")}
              className="mt-1"
            />
            <span>
              <span className="font-semibold text-coal">
                🟠 Laid Off — Serving Notice Period
              </span>
              <span className="mt-1 block text-sm text-ash">
                Employment ended/terminated, but you are still serving notice.
              </span>
            </span>
          </label>
        </fieldset>

        {status === "SERVING_NOTICE" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="lastWorkingDay">Last working day</Label>
              <Input id="lastWorkingDay" name="lastWorkingDay" type="date" required />
            </div>
            <div>
              <Label htmlFor="expectedAvailabilityDate">Expected availability date</Label>
              <Input
                id="expectedAvailabilityDate"
                name="expectedAvailabilityDate"
                type="date"
                required
              />
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
            Available Immediately
          </p>
        )}

        <FieldError>{error}</FieldError>
        <Button disabled={pending}>{pending ? "Saving…" : "Continue"}</Button>
      </form>
    </Card>
  );
}
