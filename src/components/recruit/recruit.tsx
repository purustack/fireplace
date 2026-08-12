"use client";

import { useState, useTransition } from "react";
import { searchCandidates, createContactRequest, registerRecruiterProfile } from "@/actions/recruit";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AvailabilityBadge, Badge } from "@/components/ui/badge";
import Link from "next/link";
import { hasLayoffVerifiedBadge } from "@/lib/verification-badge";

type Candidate = Awaited<ReturnType<typeof searchCandidates>>["items"][number];

export function RecruiterOnboardForm() {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card className="max-w-xl">
      <h2 className="font-display text-2xl">Recruiter profile</h2>
      <p className="mt-2 text-sm text-ash">
        Verified recruiters can contact candidates. Anonymous recruiting is not allowed.
      </p>
      <form
        className="mt-4 space-y-3"
        action={(fd) => {
          start(async () => {
            const res = await registerRecruiterProfile(fd);
            if (!res.ok) setError(res.error);
            else setError(undefined);
          });
        }}
      >
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" required />
        </div>
        <div>
          <Label htmlFor="jobTitle">Your job title</Label>
          <Input id="jobTitle" name="jobTitle" required />
        </div>
        <div>
          <Label htmlFor="companyEmail">Company email</Label>
          <Input id="companyEmail" name="companyEmail" type="email" />
        </div>
        <div>
          <Label htmlFor="companyWebsite">Company website</Label>
          <Input id="companyWebsite" name="companyWebsite" type="url" />
        </div>
        <div>
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input id="linkedinUrl" name="linkedinUrl" type="url" />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" />
        </div>
        <FieldError>{error}</FieldError>
        <Button disabled={pending}>Submit for verification</Button>
      </form>
    </Card>
  );
}

export function CandidateSearch({ initial }: { initial: Candidate[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const skills = String(fd.get("skills") ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const result = await searchCandidates({
                query: fd.get("query") || undefined,
                jobTitle: fd.get("jobTitle") || undefined,
                skills,
                location: fd.get("location") || undefined,
                availability: fd.get("availability") || undefined,
                workPreference: fd.get("workPreference") || undefined,
                verification: fd.get("verification") || undefined,
                minYears: fd.get("minYears") || undefined,
                maxYears: fd.get("maxYears") || undefined,
              });
              setItems(result.items);
            });
          }}
        >
          <Input name="query" placeholder="Search name, title…" className="md:col-span-2" />
          <Select name="availability" defaultValue="">
            <option value="">Any availability</option>
            <option value="IMMEDIATE">Available Immediately</option>
            <option value="SOON">Available Soon</option>
            <option value="SERVING_NOTICE">Serving Notice Period</option>
          </Select>
          <Input name="jobTitle" placeholder="Job title" />
          <Input name="skills" placeholder="Skills (comma-separated)" />
          <Input name="location" placeholder="Location" />
          <Input name="minYears" type="number" placeholder="Min years" />
          <Input name="maxYears" type="number" placeholder="Max years" />
          <Select name="workPreference" defaultValue="">
            <option value="">Any work mode</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </Select>
          <Select name="verification" defaultValue="ANY">
            <option value="ANY">Any verification</option>
            <option value="LAYOFF">Layoff verified</option>
            <option value="EMPLOYMENT_EMAIL">Employment email verified</option>
          </Select>
          <Button type="submit" disabled={pending} className="md:col-span-3">
            {pending ? "Searching…" : "Search candidates"}
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => (
          <Card key={c.id} className="space-y-3">
            <div>
              <h3 className="font-display text-xl text-coal">{c.user.name}</h3>
              <p className="text-sm text-ash">{c.jobTitle}</p>
            </div>
            <AvailabilityBadge status={c.layoffStatus} compact />
            <p className="text-sm text-ash">
              {c.yearsExperience ?? "—"} Years Experience
            </p>
            <p className="text-sm text-ash">
              {c.skills.map((s) => s.skill.name).join(" · ")}
            </p>
            {c.user.showLocation ? (
              <p className="text-sm text-ash">📍 {[c.city, c.country].filter(Boolean).join(", ")}</p>
            ) : null}
            {hasLayoffVerifiedBadge(c.user.verification) ? (
              <Badge tone="success">✓ Layoff Verified</Badge>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Link href={`/app/profile/${c.username}`}>
                <Button size="sm" variant="secondary">
                  View Profile
                </Button>
              </Link>
              <form
                action={(fd) => {
                  start(async () => {
                    const res = await createContactRequest(fd);
                    if (!res.ok) setError(res.error);
                    else setError(undefined);
                  });
                }}
                className="flex flex-1 flex-col gap-2"
              >
                <input type="hidden" name="candidateId" value={c.user.id} />
                <input type="hidden" name="type" value="JOB_OPPORTUNITY" />
                <Input
                  name="message"
                  placeholder="Contact message (no public PII asked)"
                  required
                  minLength={10}
                />
                <Button size="sm" type="submit" disabled={pending}>
                  Contact Candidate
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
