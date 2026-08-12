import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { logoutUser } from "@/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";

const links = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/feed", label: "Feed" },
  { href: "/app/search", label: "Search" },
  { href: "/app/messages", label: "Messages" },
  { href: "/app/recruit", label: "Recruit", roles: [Role.RECRUITER, Role.ADMIN, Role.MODERATOR] },
  { href: "/app/settings", label: "Settings" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.user?.roles ?? [];

  return (
    <div className="bg-embers min-h-screen">
      <header className="sticky top-0 z-40 border-b border-smoke/30 bg-warm-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app/dashboard" className="font-display text-xl text-coal">
              Fireplace
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links
                .filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
                .map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ash hover:bg-parchment-deep hover:text-coal"
                  >
                    {l.label}
                  </Link>
                ))}
              {session?.user && hasRole({ roles }, Role.ADMIN, Role.MODERATOR) ? (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ember hover:bg-ember-soft"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ash sm:inline">
              {session?.user?.name}
            </span>
            <form action={logoutUser}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
