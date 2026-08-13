"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfessionalProfile, uploadAvatar, uploadResume } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MultiSelect, SearchableSelect } from "@/components/ui/multi-select";
import {
  INDUSTRIES,
  JOB_TITLES,
  LOOKING_FOR,
  PREFERRED_LOCATIONS,
  SKILLS,
} from "@/lib/onboarding-options";

export function ProfessionalForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [preferredWorkLocation, setPreferredWorkLocation] = useState("");
  const [primarySkills, setPrimarySkills] = useState<string[]>([]);
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  return (
    <Card className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-ember">
        Step 2 of 4
      </p>
      <h1 className="mt-2 font-display text-3xl text-coal">Professional information</h1>
      <form
        className="mt-6 space-y-4"
        action={(fd) => {
          start(async () => {
            if (!jobTitle || !industry || primarySkills.length === 0) {
              setError("Please complete job title, industry, and at least one primary skill.");
              return;
            }
            const res = await saveProfessionalProfile(fd);
            if (!res.ok) setError(res.error);
            else {
              const photo = fd.get("avatar");
              if (photo instanceof File && photo.size > 0) {
                const photoRes = await uploadAvatar(fd);
                if (!photoRes.ok) {
                  setError(photoRes.error);
                  return;
                }
              }
              const resume = fd.get("resume");
              if (resume instanceof File && resume.size > 0) {
                await uploadResume(fd);
              }
              router.push("/onboarding/layoff");
            }
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SearchableSelect
            name="jobTitle"
            label="Current / previous job title"
            options={JOB_TITLES}
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Search job titles…"
            required
          />
          <div>
            <Label htmlFor="previousCompany">Previous company</Label>
            <Input id="previousCompany" name="previousCompany" required />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input id="yearsExperience" name="yearsExperience" type="number" min={0} required />
          </div>
          <SearchableSelect
            name="industry"
            label="Industry"
            options={INDUSTRIES}
            value={industry}
            onChange={setIndustry}
            placeholder="Select industry…"
            required
          />
        </div>

        <MultiSelect
          name="primarySkills"
          label="Primary skills"
          options={SKILLS}
          value={primarySkills}
          onChange={setPrimarySkills}
          placeholder="Select primary skills…"
          required
          max={10}
          hint="Choose up to 10. Add custom skills if needed."
        />

        <MultiSelect
          name="secondarySkills"
          label="Secondary skills"
          options={SKILLS.filter((s) => !primarySkills.includes(s))}
          value={secondarySkills}
          onChange={setSecondarySkills}
          placeholder="Select secondary skills…"
          max={10}
          hint="Optional. Skills already chosen as primary are hidden here."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="workPreference">Work preference</Label>
            <Select id="workPreference" name="workPreference" defaultValue="REMOTE">
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </Select>
          </div>
          <SearchableSelect
            name="preferredWorkLocation"
            label="Preferred work location"
            options={PREFERRED_LOCATIONS}
            value={preferredWorkLocation}
            onChange={setPreferredWorkLocation}
            placeholder="Select preferred location…"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" name="linkedinUrl" type="url" />
          </div>
          <div>
            <Label htmlFor="portfolioUrl">Portfolio URL</Label>
            <Input id="portfolioUrl" name="portfolioUrl" type="url" />
          </div>
        </div>

        <MultiSelect
          name="lookingFor"
          label="Looking for"
          options={LOOKING_FOR}
          value={lookingFor}
          onChange={setLookingFor}
          placeholder="What are you looking for?"
          max={10}
          hint="Select all that apply."
        />

        <div>
          <Label htmlFor="about">About</Label>
          <Textarea id="about" name="about" />
        </div>
        <div>
          <Label htmlFor="avatar">Profile photo</Label>
          <Input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          />
          <p className="mt-1 text-xs text-ash">Optional. JPG, PNG, or WebP · max 2MB</p>
        </div>
        <div>
          <Label htmlFor="resume">Resume (PDF/DOC)</Label>
          <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf" />
        </div>
        <FieldError>{error}</FieldError>
        <Button disabled={pending}>{pending ? "Saving…" : "Continue"}</Button>
      </form>
    </Card>
  );
}
