export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { searchCandidates } from "@/actions/recruit";
import { CandidateSearch, RecruiterOnboardForm } from "@/components/recruit/recruit";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RecruitPage() {
  const session = await auth();
  const user = session!.user;
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { userId: user.id },
  });

  if (!recruiter && !hasRole(user, Role.RECRUITER, Role.ADMIN)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Recruiter access</h1>
          <p className="mt-2 text-ash">
            Register as a recruiter to search immediately available talent.
          </p>
        </div>
        <RecruiterOnboardForm />
      </div>
    );
  }

  const result = await searchCandidates({ availability: "IMMEDIATE", page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-coal">Find candidates</h1>
          <p className="mt-2 text-ash">
            Prioritize immediate joiners. Contact stays inside Fireplace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {recruiter?.verified ? (
            <Badge tone="success">✓ Verified Recruiter</Badge>
          ) : (
            <Badge tone="warning">Pending recruiter verification</Badge>
          )}
          {!recruiter ? (
            <Link href="/app/recruit#onboard">
              <Button size="sm" variant="secondary">
                Complete recruiter profile
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {!recruiter ? (
        <Card id="onboard">
          <RecruiterOnboardForm />
        </Card>
      ) : null}

      <CandidateSearch initial={result.items} />
    </div>
  );
}
