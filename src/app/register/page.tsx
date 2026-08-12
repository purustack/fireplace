import Link from "next/link";
import { RegisterForm } from "@/components/auth/forms";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="bg-hearth flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-2xl text-coal">
        Fireplace
      </Link>
      <RegisterForm recruiterHint={params.role === "recruiter"} />
    </div>
  );
}
