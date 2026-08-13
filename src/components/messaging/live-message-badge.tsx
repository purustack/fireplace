"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UnreadBadge } from "@/components/ui/unread-badge";

const EVENT = "fireplace:messages";
const POLL_MS = 4000;

const UnreadContext = createContext(0);

export function notifyMessagesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function MessageLiveProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/messages/live", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { unread?: number };
        if (!cancelled) setCount(data.unread ?? 0);
      } catch {
        /* ignore network blips */
      }
    }

    load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener(EVENT, onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(EVENT, onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <UnreadContext.Provider value={count}>{children}</UnreadContext.Provider>;
}

export function LiveMessageBadge() {
  const count = useContext(UnreadContext);
  return <UnreadBadge count={count} />;
}
