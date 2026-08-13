"use client";

import { useState, useTransition } from "react";
import {
  createBuildIdea,
  expressBuildInterest,
  respondBuildInterest,
} from "@/actions/build";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";

export function CreateIdeaForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <form
      className="space-y-3"
      action={(fd) => {
        start(async () => {
          const res = await createBuildIdea(fd);
          if (!res.ok) setError(res.error);
          else {
            setError(undefined);
            (document.getElementById("build-idea-form") as HTMLFormElement | null)?.reset();
          }
        });
      }}
      id="build-idea-form"
    >
      <div>
        <Label htmlFor="title">What do you want to build?</Label>
        <Input id="title" name="title" required minLength={5} placeholder="A tiny tool for…" />
      </div>
      <div>
        <Label htmlFor="description">Why this, why now</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={20}
          placeholder="Skill you have, time you have, who you need. Not a pitch deck."
        />
      </div>
      <div>
        <Label htmlFor="requiredSkills">Skills needed (comma-separated)</Label>
        <Input id="requiredSkills" name="requiredSkills" placeholder="React, design, backend…" />
      </div>
      <div>
        <Label htmlFor="lookingFor">Looking for</Label>
        <Input id="lookingFor" name="lookingFor" placeholder="A co-builder for evenings this month" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="compensationType">How we’d work</Label>
          <Select id="compensationType" name="compensationType" defaultValue="EQUITY">
            <option value="EQUITY">Equity / sweat</option>
            <option value="PAID">Paid if it works</option>
            <option value="VOLUNTEER">Just for the thing</option>
            <option value="EQUITY_AND_PAID">Equity + paid</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="workPreference">Where</Label>
          <Select id="workPreference" name="workPreference" defaultValue="REMOTE">
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">In person</option>
          </Select>
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button disabled={pending}>{pending ? "Posting…" : "Put it on the table"}</Button>
    </form>
  );
}

export function JoinIdeaButton({ ideaId }: { ideaId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => start(async () => { await expressBuildInterest(ideaId); })}
    >
      {pending ? "Sending…" : "I’m interested"}
    </Button>
  );
}

export function IdeaRequestActions({ joinId }: { joinId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-2 flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => start(async () => { await respondBuildInterest(joinId, "ACCEPTED"); })}
      >
        Welcome them
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => start(async () => { await respondBuildInterest(joinId, "DECLINED"); })}
      >
        Not this time
      </Button>
    </div>
  );
}
