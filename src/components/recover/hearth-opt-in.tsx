"use client";

import { useTransition } from "react";
import { setHearthOptIn } from "@/actions/recover";
import { Button } from "@/components/ui/button";

export function HearthOptIn({ optedIn }: { optedIn: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      variant={optedIn ? "secondary" : "primary"}
      onClick={() => start(async () => { await setHearthOptIn(!optedIn); })}
    >
      {pending ? "Saving…" : optedIn ? "Leave the hearth" : "Opt in — privately"}
    </Button>
  );
}
