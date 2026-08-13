import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  if (session.user.onboardingStep < 4) {
    const step =
      session.user.onboardingStep <= 2
        ? "/onboarding/professional"
        : session.user.onboardingStep === 3
          ? "/onboarding/layoff"
          : "/onboarding/verification";
    redirect(step);
  }

  return <AppShell>{children}</AppShell>;
}
