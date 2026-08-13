import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";
import { LoginForm } from "@/components/auth/forms";
import { Suspense } from "react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.onboardingStep < 4 ? "/onboarding/professional" : "/app/dashboard");
  }

  return (
    <div className="bg-hearth flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-2xl text-coal">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-warm-white">
          <Flame className="h-4 w-4" />
        </span>
        Fireplace
      </Link>
      <Suspense>
        <LoginForm googleEnabled={isGoogleAuthEnabled()} />
      </Suspense>
    </div>
  );
}
