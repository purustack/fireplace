"use client";

import { useState, useTransition } from "react";
import { saveRunway } from "@/actions/recover";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/input";

export function RunwayForm({
  savings,
  burn,
  currency,
}: {
  savings?: number | null;
  burn?: number | null;
  currency?: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        start(async () => {
          const res = await saveRunway(fd);
          if (!res.ok) {
            setError(res.error);
            setSaved(false);
          } else {
            setError(undefined);
            setSaved(true);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="runwaySavings">Savings / cash on hand</Label>
          <Input
            id="runwaySavings"
            name="runwaySavings"
            type="number"
            min={0}
            required
            defaultValue={savings ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="runwayMonthlyBurn">Monthly spend</Label>
          <Input
            id="runwayMonthlyBurn"
            name="runwayMonthlyBurn"
            type="number"
            min={1}
            required
            defaultValue={burn ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="runwayCurrency">Currency</Label>
          <Select id="runwayCurrency" name="runwayCurrency" defaultValue={currency ?? "INR"}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-ash">Only you can see these numbers. Never shown to recruiters.</p>
      <FieldError>{error}</FieldError>
      {saved ? (
        <p className="text-sm font-medium text-success">Saved. Still private.</p>
      ) : null}
      <Button disabled={pending}>{pending ? "Saving…" : "Update runway"}</Button>
    </form>
  );
}
