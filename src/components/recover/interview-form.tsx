"use client";

import { useState, useTransition } from "react";
import { addInterviewNote } from "@/actions/interviews";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";

export function InterviewForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-3"
      action={(fd) => {
        start(async () => {
          const res = await addInterviewNote(fd);
          if (!res.ok) {
            setError(res.error);
            setSaved(false);
          } else {
            setError(undefined);
            setSaved(true);
            (document.getElementById("interview-form") as HTMLFormElement | null)?.reset();
          }
        });
      }}
      id="interview-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required placeholder="Who you met" />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="round">Round</Label>
          <Select id="round" name="round" defaultValue="SCREEN">
            <option value="SCREEN">Recruiter / screen</option>
            <option value="HIRING_MANAGER">Hiring manager</option>
            <option value="PANEL">Panel</option>
            <option value="ASSIGNMENT">Assignment / take-home</option>
            <option value="OFFER">Offer conversation</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="happenedAt">When</Label>
          <Input id="happenedAt" name="happenedAt" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="feeling">How it left you</Label>
        <Select id="feeling" name="feeling" defaultValue="MIXED">
          <option value="HOPEFUL">Hopeful</option>
          <option value="MIXED">Mixed</option>
          <option value="DRAINED">Drained</option>
          <option value="UNSURE">Unsure</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="wentWell">What went well</Label>
        <Textarea id="wentWell" name="wentWell" placeholder="Even one sentence is enough." />
      </div>
      <div>
        <Label htmlFor="toImprove">What you’d do differently</Label>
        <Textarea id="toImprove" name="toImprove" />
      </div>
      <div>
        <Label htmlFor="askNext">Questions to ask next time</Label>
        <Textarea id="askNext" name="askNext" />
      </div>
      <div>
        <Label htmlFor="nextStep">Next step</Label>
        <Input id="nextStep" name="nextStep" placeholder="Waiting to hear / follow-up Friday…" />
      </div>
      <label className="flex items-center gap-2 text-sm text-ash">
        <input type="checkbox" name="wantPeerEyes" className="accent-[var(--ember)]" />
        I’d like a peer to look at this later (still private for now)
      </label>
      <FieldError>{error}</FieldError>
      {saved ? <p className="text-sm font-medium text-success">Saved to your notes.</p> : null}
      <Button disabled={pending}>{pending ? "Saving…" : "Save aftercare note"}</Button>
    </form>
  );
}
