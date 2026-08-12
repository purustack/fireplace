import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-smoke/30 bg-warm-white p-5 shadow-sm shadow-coal/5",
        className,
      )}
    >
      {children}
    </div>
  );
}
