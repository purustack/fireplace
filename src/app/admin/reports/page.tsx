export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { resolveReport } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    include: { reporter: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const counts = await prisma.report.groupBy({
    by: ["targetId", "targetType"],
    where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    _count: true,
  });
  const countMap = new Map(
    counts.map((c) => [`${c.targetType}:${c.targetId}`, c._count]),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Reports queue</h1>
      <p className="text-sm text-ash">
        Single reports do not auto-remove users. Review evidence and history.
      </p>
      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning">{r.reason}</Badge>
              <Badge>{r.targetType}</Badge>
              <Badge tone="ember">
                {countMap.get(`${r.targetType}:${r.targetId}`) ?? 1} report(s) on target
              </Badge>
            </div>
            <p className="text-sm text-ash">
              Reporter: {r.reporter.name} · Target ID: {r.targetId}
            </p>
            {r.details ? <p className="text-sm text-coal">{r.details}</p> : null}
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await resolveReport({
                    reportId: r.id,
                    status: "RESOLVED",
                    resolution: "Action taken after review",
                  });
                }}
              >
                <Button size="sm" type="submit">
                  Resolve
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await resolveReport({
                    reportId: r.id,
                    status: "DISMISSED",
                    resolution: "Insufficient evidence",
                  });
                }}
              >
                <Button size="sm" variant="secondary" type="submit">
                  Dismiss
                </Button>
              </form>
            </div>
          </Card>
        ))}
        {reports.length === 0 ? (
          <Card>
            <p className="text-ash">Queue is clear.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
