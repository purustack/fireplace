export const KIT_ITEMS = [
  {
    id: "breathe",
    title: "Tell one person",
    body: "You don’t have to post about it. Text one person you trust: you were laid off, you’re okay, you’ll talk more later.",
  },
  {
    id: "dates",
    title: "Write down the dates",
    body: "Last working day, when access gets cut, and when notice actually ends. Put them in your calendar.",
  },
  {
    id: "docs",
    title: "Save your papers",
    body: "Offer letter, last payslips, relieving / experience letter request, tax forms, stock or PF statements — on a personal drive.",
  },
  {
    id: "access",
    title: "Personal copies only",
    body: "Move your own files off the work laptop. Don’t take confidential company material. Change personal passwords you reused.",
  },
  {
    id: "hr",
    title: "Ask HR in writing",
    body: "Full & final timeline, unused leave, insurance end date, PF / 401k, and severance if any. Email beats a verbal “we’ll get back to you.”",
  },
  {
    id: "letter",
    title: "Request your experience letter",
    body: "Do it now, while someone still answers. You’ll need it sooner than you think.",
  },
  {
    id: "story",
    title: "One sentence, no apology",
    body: "Practice: “My role was eliminated in a layoff.” That’s the whole story. You don’t owe a performance review.",
  },
  {
    id: "runway",
    title: "Know your runway",
    body: "Open Recover → Runway. Savings ÷ monthly spend = weeks you actually have. No shame in the number.",
  },
  {
    id: "hearth",
    title: "Find your company hearth",
    body: "Opt in so others from the same layoff can find you. Recruiters never see this list.",
  },
  {
    id: "week",
    title: "One job for this week",
    body: "Not fifty applications. One conversation, one document, or one real rest day — then stop.",
  },
] as const;

export type KitItemId = (typeof KIT_ITEMS)[number]["id"];

export function kitProgress(completed: string[]) {
  const done = KIT_ITEMS.filter((i) => completed.includes(i.id)).length;
  return {
    done,
    total: KIT_ITEMS.length,
    percent: Math.round((done / KIT_ITEMS.length) * 100),
  };
}

export type WeekPlanItem = { title: string; why: string; href: string };

export function buildWeekPlan(input: {
  kitDone: number;
  kitTotal: number;
  weeksLeft: number | null;
  supportNeeded: string[];
  hearthOptIn: boolean;
  hasCompany: boolean;
}) {
  const items: WeekPlanItem[] = [];

  if (input.kitDone < input.kitTotal) {
    items.push({
      title: "Finish the 72-hour kit",
      why: `${input.kitDone}/${input.kitTotal} done. The admin stuff is boring and it protects you.`,
      href: "/app/recover/kit",
    });
  }

  if (input.weeksLeft == null) {
    items.push({
      title: "Estimate your runway",
      why: "Two numbers. Then you’ll know whether this week is for rest, reach-outs, or both.",
      href: "/app/recover/runway",
    });
  } else if (input.weeksLeft < 8) {
    items.push({
      title: "Protect the money first",
      why: `About ${input.weeksLeft} weeks of runway. Confirm F&F, insurance, and one warm reach-out — not a spray of applications.`,
      href: "/app/recover/kit",
    });
  } else if (input.weeksLeft < 16) {
    items.push({
      title: "Three human conversations",
      why: "You have some time. Use it on people, not portals.",
      href: "/app/recover/hearth",
    });
  } else {
    items.push({
      title: "Build something with someone",
      why: "Runway is longer. A small project with another Fireplace member beats doom-scrolling jobs.",
      href: "/app/build",
    });
  }

  if (input.hasCompany && !input.hearthOptIn) {
    items.push({
      title: "Join your company hearth",
      why: "The people who got the same email are the warmest network you’ll have this month.",
      href: "/app/recover/hearth",
    });
  }

  if (input.supportNeeded.includes("INTERVIEW_PREP")) {
    items.push({
      title: "Write up your last interview",
      why: "You asked for interview help. Dump the round while it’s fresh — even a messy one.",
      href: "/app/recover/interviews",
    });
  }

  if (input.supportNeeded.includes("PEER_SUPPORT") || input.supportNeeded.includes("NETWORKING")) {
    items.push({
      title: "Talk to one person in the same boat",
      why: "Not a recruiter. Someone who also lost a seat.",
      href: "/app/recover/hearth",
    });
  }

  items.push({
    title: "Protect one rest block",
    why: "Grief and job search use the same battery. Put a real off-hours on the calendar.",
    href: "/app/dashboard",
  });

  return items.slice(0, 4);
}
