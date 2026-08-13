"use client";

import { useOptimistic, useTransition } from "react";
import { toggleKitItem } from "@/actions/recover";
import { KIT_ITEMS } from "@/lib/kit";
import { Check } from "lucide-react";

export function KitList({ completed }: { completed: string[] }) {
  const [pending, start] = useTransition();
  const [ids, setIds] = useOptimistic(completed);

  return (
    <ul className="space-y-3">
      {KIT_ITEMS.map((item) => {
        const done = ids.includes(item.id);
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setIds((cur) =>
                  cur.includes(item.id) ? cur.filter((id) => id !== item.id) : [...cur, item.id],
                );
                start(async () => {
                  await toggleKitItem(item.id);
                });
              }}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                done
                  ? "border-success/30 bg-success/5"
                  : "border-smoke/30 bg-warm-white hover:border-ember/30"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-success text-white" : "border border-smoke/40 bg-parchment"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span>
                <span className={`block font-semibold ${done ? "text-ash line-through" : "text-coal"}`}>
                  {item.title}
                </span>
                <span className="mt-1 block text-sm text-ash">{item.body}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
