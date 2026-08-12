import Link from "next/link";
import { LoginForm } from "@/components/auth/forms";

export default function LoginPage() {
  return (
    <div className="bg-hearth flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-2xl text-coal">
        Fireplace
      </Link>
      <LoginForm />
    </div>
  );
}
