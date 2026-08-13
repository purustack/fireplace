import Link from "next/link";
import { Flame } from "lucide-react";
import { RegisterForm } from "@/components/auth/forms";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="bg-hearth flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-2xl text-coal">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-warm-white">
          <Flame className="h-4 w-4" />
        </span>
        Fireplace
      </Link>
      <RegisterForm recruiterHint={params.role === "recruiter"} />
    </div>
  );
}
