import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="bg-hearth min-h-screen px-4 py-10">
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between">
        <Link href="/" className="font-display text-2xl text-coal">
          Fireplace
        </Link>
        <p className="text-sm text-ash">Onboarding</p>
      </div>
      {children}
    </div>
  );
}
