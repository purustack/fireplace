export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { AvailabilityBadge, Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const [people, jobs, posts] = query
    ? await Promise.all([
        prisma.profile.findMany({
          where: {
            user: { publicProfile: true, accountStatus: { notIn: ["BANNED", "SUSPENDED"] } },
            OR: [
              { user: { name: { contains: query, mode: "insensitive" } } },
              { jobTitle: { contains: query, mode: "insensitive" } },
              { previousCompany: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
              { skills: { some: { skill: { name: { contains: query, mode: "insensitive" } } } } },
            ],
          },
          take: 12,
          omit: { layoffSurvey: true, layoffSurveyAt: true },
          include: {
            user: { select: { name: true, showLocation: true } },
            skills: { include: { skill: true }, take: 4 },
          },
        }),
        prisma.post.findMany({
          where: {
            published: true,
            category: "JOB_OPPORTUNITY",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 12,
          include: { author: { select: { name: true } } },
        }),
        prisma.post.findMany({
          where: {
            published: true,
            category: { not: "JOB_OPPORTUNITY" },
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 12,
        }),
      ])
    : [[], [], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-coal">Search</h1>
        <p className="mt-2 text-ash">People, jobs, and community discussions.</p>
      </div>
      <Card>
        <form className="flex gap-2">
          <Input name="q" defaultValue={query} placeholder="Search Fireplace…" />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {query ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-3">
            <h2 className="font-display text-xl">People</h2>
            {people.map((p) => (
              <Card key={p.id}>
                <Link href={`/app/profile/${p.username}`} className="font-semibold text-coal">
                  {p.user.name}
                </Link>
                <p className="text-sm text-ash">{p.jobTitle}</p>
                <div className="mt-2">
                  <AvailabilityBadge status={p.layoffStatus} compact />
                </div>
              </Card>
            ))}
            {people.length === 0 ? <p className="text-sm text-ash">No people found.</p> : null}
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-xl">Jobs</h2>
            {jobs.map((j) => (
              <Card key={j.id}>
                <p className="font-semibold text-coal">{j.title}</p>
                <p className="text-sm text-ash">by {j.author.name}</p>
                {j.jobStatus ? <Badge className="mt-2">{j.jobStatus}</Badge> : null}
              </Card>
            ))}
            {jobs.length === 0 ? <p className="text-sm text-ash">No jobs found.</p> : null}
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-xl">Posts</h2>
            {posts.map((p) => (
              <Card key={p.id}>
                <p className="font-semibold text-coal">{p.title}</p>
                <p className="text-sm text-ash">{p.category}</p>
              </Card>
            ))}
            {posts.length === 0 ? <p className="text-sm text-ash">No posts found.</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
