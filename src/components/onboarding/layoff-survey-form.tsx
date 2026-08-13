"use client";

import { useState, useTransition } from "react";
import { saveLayoffSurvey } from "@/actions/profile";
import { LayoffSurveyFields } from "@/components/onboarding/layoff-survey-fields";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import type { LayoffSurveyAnswers } from "@/lib/layoff-survey";

export function LayoffSurveyForm({ initial }: { initial?: LayoffSurveyAnswers | null }) {
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        start(async () => {
          const res = await saveLayoffSurvey(fd);
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
      <LayoffSurveyFields initial={initial} optional={false} />
      <FieldError>{error}</FieldError>
      {saved ? (
        <p className="rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
          Survey saved. Still private — only you can see it.
        </p>
      ) : null}
      <Button disabled={pending}>{pending ? "Saving…" : "Save survey"}</Button>
    </form>
  );
}
