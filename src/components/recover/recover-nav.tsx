"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/app/recover", label: "Overview", exact: true },
  { href: "/app/recover/kit", label: "72-hour kit" },
  { href: "/app/recover/hearth", label: "Company hearth" },
  { href: "/app/recover/runway", label: "Runway" },
  { href: "/app/recover/interviews", label: "Interviews" },
];

export function RecoverNav() {
  const pathname = usePathname();
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-ember text-warm-white shadow-sm"
                : "bg-parchment text-ash hover:bg-ember-soft hover:text-coal"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
