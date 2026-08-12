export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { reviewLayoffDocument } from "@/actions/verification";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminVerificationsPage() {
  const docs = await prisma.verificationDocument.findMany({
    where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    include: {
      verification: {
        include: {
          user: { select: { id: true, name: true, email: true, profile: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Layoff documentation review</h1>
      <p className="text-sm text-ash">
        Documents are private. Never share contents outside moderation.
      </p>
      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-coal">{doc.verification.user.name}</p>
                <p className="text-sm text-ash">
                  {doc.fileName} · {doc.mimeType} · {Math.round(doc.sizeBytes / 1024)} KB
                </p>
              </div>
              <Badge tone="warning">{doc.status}</Badge>
            </div>
            <a
              href={`/api/files/${doc.storageKey}`}
              className="text-sm font-semibold text-ember"
            >
              Open private document
            </a>
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await reviewLayoffDocument({
                    documentId: doc.id,
                    decision: "VERIFIED",
                  });
                }}
              >
                <Button size="sm" type="submit">
                  Verify
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await reviewLayoffDocument({
                    documentId: doc.id,
                    decision: "REJECTED",
                    notes: "Documentation insufficient or unclear.",
                  });
                }}
              >
                <Button size="sm" variant="secondary" type="submit">
                  Reject
                </Button>
              </form>
            </div>
          </Card>
        ))}
        {docs.length === 0 ? (
          <Card>
            <p className="text-ash">No documents awaiting review.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
