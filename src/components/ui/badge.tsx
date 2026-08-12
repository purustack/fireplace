import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "ember" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-parchment-deep text-ash",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    ember: "bg-ember-soft text-ember-deep",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AvailabilityBadge({
  status,
  compact = false,
}: {
  status: "SERVING_NOTICE" | "AVAILABLE_IMMEDIATELY";
  compact?: boolean;
}) {
  if (status === "AVAILABLE_IMMEDIATELY") {
    return (
      <Badge tone="success" className="uppercase tracking-wide">
        <span aria-hidden>🟢</span>
        {compact ? "Available Immediately" : "Laid Off — Available Immediately"}
      </Badge>
    );
  }

  return (
    <Badge tone="warning" className="tracking-wide">
      <span aria-hidden>🟠</span>
      {compact ? "Serving Notice" : "Laid Off — Serving Notice Period"}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-smoke/50 bg-warm-white/60 px-6 py-12 text-center">
      <h3 className="font-display text-xl text-coal">{title}</h3>
      {description ? <p className="mt-2 text-sm text-ash">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
