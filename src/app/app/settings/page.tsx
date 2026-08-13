export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePrivacySettings } from "@/actions/profile";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { LayoffSurveyForm } from "@/components/onboarding/layoff-survey-form";
import { isLayoffSurveyAnswers } from "@/lib/layoff-survey";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: { profile: true },
  });
  const rawSurvey = user.profile?.layoffSurvey;
  const survey = isLayoffSurveyAnswers(rawSurvey) ? rawSurvey : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-coal">Privacy & settings</h1>
        <p className="mt-2 text-ash">
          You control what recruiters and the community can see.
        </p>
      </div>

      <Card>
        <AvatarUploader name={user.name} image={user.image} />
      </Card>

      <Card>
        <form
          action={async (fd) => {
            "use server";
            await updatePrivacySettings(fd);
          }}
          className="space-y-4"
        >
          {(
            [
              ["recruiterVisibility", "Recruiter visibility", user.recruiterVisibility],
              ["publicProfile", "Public profile", user.publicProfile],
              ["showPreviousCompany", "Show previous company", user.showPreviousCompany],
              ["showLocation", "Show location", user.showLocation],
            ] as const
          ).map(([name, label, checked]) => (
            <label key={name} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-coal">{label}</span>
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked}
                className="h-4 w-4 accent-[var(--ember)]"
              />
            </label>
          ))}
          <div>
            <Label htmlFor="allowMessages">Allow messages</Label>
            <Select id="allowMessages" name="allowMessages" defaultValue={user.allowMessages}>
              <option value="EVERYONE">Everyone</option>
              <option value="VERIFIED_RECRUITERS">Verified recruiters only</option>
              <option value="CONNECTIONS">Connections only</option>
            </Select>
          </div>
          {user.profile?.layoffStatus === "AVAILABLE_IMMEDIATELY" ? (
            <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
              When recruiter visibility is on, your Available Immediately status is
              discoverable in candidate search.
            </p>
          ) : null}
          <Button type="submit">Save privacy settings</Button>
        </form>
      </Card>

      <Card>
        <LayoffSurveyForm initial={survey} />
      </Card>

      <Card>
        <h2 className="font-display text-xl">Never exposed by default</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ash">
          <li>Password</li>
          <li>Private email & phone</li>
          <li>Uploaded verification documents</li>
          <li>Salary / severance details</li>
          <li>Layoff survey answers</li>
        </ul>
        {user.profile ? (
          <Link
            href={`/app/profile/${user.profile.username}`}
            className="mt-4 inline-block text-sm font-semibold text-ember"
          >
            View your profile →
          </Link>
        ) : null}
      </Card>
    </div>
  );
}
