"use client";

import {
  SURVEY_EXPECTED,
  SURVEY_NOTICE,
  SURVEY_NOTIFIED,
  SURVEY_REASONS,
  SURVEY_SEVERANCE,
  SURVEY_SUPPORT,
  SURVEY_TENURE,
  type LayoffSurveyAnswers,
} from "@/lib/layoff-survey";
import { Label, Textarea } from "@/components/ui/input";

function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium text-coal">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-smoke/30 bg-warm-white px-3 py-2.5 text-sm"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
            className="mt-0.5 accent-[var(--ember)]"
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function CheckGroup({
  name,
  legend,
  hint,
  options,
  defaultValues = [],
}: {
  name: string;
  legend: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  defaultValues?: string[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium text-coal">{legend}</legend>
      {hint ? <p className="mb-2 text-xs text-ash">{hint}</p> : null}
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-smoke/30 bg-warm-white px-3 py-2.5 text-sm"
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={defaultValues.includes(o.value)}
            className="mt-0.5 accent-[var(--ember)]"
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function LayoffSurveyFields({
  initial,
  optional = true,
}: {
  initial?: LayoffSurveyAnswers | null;
  optional?: boolean;
}) {
  return (
    <div id="layoff-survey" className="space-y-5 rounded-2xl border border-ember/20 bg-ember-soft/30 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember">
          Quick survey{optional ? " · optional" : ""}
        </p>
        <h2 className="mt-1 font-display text-xl text-coal">A few questions about the layoff</h2>
        <p className="mt-1 text-sm text-ash">
          Private to you. Recruiters and other members never see these answers — we use them to
          understand patterns and point you toward the right support.
        </p>
      </div>

      <RadioGroup
        name="expected"
        legend="Were you expecting this?"
        options={SURVEY_EXPECTED}
        defaultValue={initial?.expected}
      />

      <CheckGroup
        name="reasons"
        legend="What do you think was behind it?"
        hint="Select all that feel true. There’s no wrong answer."
        options={SURVEY_REASONS}
        defaultValues={initial?.reasons}
      />

      <RadioGroup
        name="notifiedHow"
        legend="How were you told?"
        options={SURVEY_NOTIFIED}
        defaultValue={initial?.notifiedHow}
      />

      <RadioGroup
        name="tenure"
        legend="How long had you been at the company?"
        options={SURVEY_TENURE}
        defaultValue={initial?.tenure}
      />

      <RadioGroup
        name="notice"
        legend="How much notice did you get?"
        options={SURVEY_NOTICE}
        defaultValue={initial?.notice}
      />

      <RadioGroup
        name="severance"
        legend="Were you offered severance?"
        options={SURVEY_SEVERANCE}
        defaultValue={initial?.severance}
      />

      <CheckGroup
        name="supportNeeded"
        legend="What would help most right now?"
        hint="We’ll use this to shape the feed and community — still private."
        options={SURVEY_SUPPORT}
        defaultValues={initial?.supportNeeded}
      />

      <div>
        <Label htmlFor="notes">Anything else you want to share?</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={1000}
          defaultValue={initial?.notes}
          placeholder="Optional. Only you can see this."
        />
      </div>
    </div>
  );
}
