export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminHomePage() {
  const [users, pendingDocs, pendingReports, recruiters] = await Promise.all([
    prisma.user.count(),
    prisma.verificationDocument.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.report.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.recruiterProfile.count({ where: { verified: false } }),
  ]);

  const stats = [
    { label: "Users", value: users },
    { label: "Docs awaiting review", value: pendingDocs },
    { label: "Open reports", value: pendingReports },
    { label: "Unverified recruiters", value: recruiters },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-coal">Moderation overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-ash">{s.label}</p>
            <p className="mt-2 font-display text-3xl text-coal">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-ash">
          Do not auto-ban from a single report. Use report count, evidence, verification
          status, and account history before suspending or banning.
        </p>
      </Card>
    </div>
  );
}
