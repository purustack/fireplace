export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`${count} unread messages`}
      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold leading-none text-warm-white shadow-sm ring-2 ring-warm-white"
    >
      {label}
    </span>
  );
}
