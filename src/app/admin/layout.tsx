import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user, Role.ADMIN, Role.MODERATOR)) redirect("/app/dashboard");

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/verifications", label: "Verifications" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/recruiters", label: "Recruiters" },
  ];

  return (
    <div className="bg-parchment min-h-screen">
      <header className="border-b border-smoke/30 bg-warm-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-display text-xl text-coal">
            Fireplace Admin
          </Link>
          <Link href="/app/dashboard" className="text-sm text-ash hover:text-coal">
            Back to app
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ash hover:bg-ember-soft hover:text-coal"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
