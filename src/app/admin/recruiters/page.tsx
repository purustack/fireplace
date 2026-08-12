export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { verifyRecruiter } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminRecruitersPage() {
  const recruiters = await prisma.recruiterProfile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Recruiters</h1>
      <div className="space-y-3">
        {recruiters.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-coal">{r.user.name}</p>
              <p className="text-sm text-ash">
                {r.companyName} · {r.jobTitle}
              </p>
              <div className="mt-2">
                {r.verified ? (
                  <Badge tone="success">✓ Verified Recruiter</Badge>
                ) : (
                  <Badge tone="warning">Pending</Badge>
                )}
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await verifyRecruiter(r.id, !r.verified);
              }}
            >
              <Button size="sm" type="submit" variant={r.verified ? "secondary" : "primary"}>
                {r.verified ? "Revoke" : "Verify"}
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
