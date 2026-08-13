import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { logoutUser } from "@/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";
import { Flame, LayoutDashboard, Newspaper, Search, MessageCircle, Users, Settings } from "lucide-react";

const links = [
  { href: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/app/feed", label: "Feed", icon: Newspaper },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/messages", label: "Messages", icon: MessageCircle },
  { href: "/app/recruit", label: "Recruit", icon: Users, roles: [Role.RECRUITER, Role.ADMIN, Role.MODERATOR] },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.user?.roles ?? [];

  return (
    <div className="bg-embers min-h-screen">
      <header className="sticky top-0 z-40 border-b border-smoke/20 bg-warm-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-warm-white shadow-sm shadow-ember/30">
                <Flame className="h-4 w-4" />
              </span>
              <span className="font-display text-xl text-coal">Fireplace</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links
                .filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
                .map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-ash transition hover:bg-ember-soft/60 hover:text-coal"
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
              {session?.user && hasRole({ roles }, Role.ADMIN, Role.MODERATOR) ? (
                <Link
                  href="/admin"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-ember hover:bg-ember-soft"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-ash sm:inline">
              {session?.user?.name}
            </span>
            <form action={logoutUser}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {links
            .filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-parchment px-3 py-1.5 text-xs font-semibold text-ash"
              >
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
