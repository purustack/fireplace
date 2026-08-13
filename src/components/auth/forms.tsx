"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/multi-select";
import { COUNTRIES, MAJOR_CITIES } from "@/lib/onboarding-options";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GoogleSignInButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signIn("google", { callbackUrl: "/app/dashboard" });
        })
      }
    >
      <GoogleIcon />
      {pending ? "Redirecting…" : label}
    </Button>
  );
}

function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-smoke/30" />
      </div>
      <span className="relative mx-auto flex w-fit bg-warm-white px-3 text-xs font-medium uppercase tracking-wider text-ash">
        or
      </span>
    </div>
  );
}

export function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const authError =
    error ||
    (oauthError
      ? oauthError === "AccessDenied"
        ? "Google sign-in was denied or this account is suspended."
        : "Google sign-in failed. Please try again."
      : undefined);

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-coal">Welcome back</h1>
      <p className="mt-2 text-sm text-ash">Log in to continue rebuilding.</p>
      {googleEnabled ? (
        <>
          <div className="mt-6">
            <GoogleSignInButton label="Continue with Google" />
          </div>
          <AuthDivider />
        </>
      ) : (
        <div className="mt-6" />
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "").toLowerCase();
          const password = String(fd.get("password") ?? "");
          start(async () => {
            setError(undefined);
            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (res?.error) {
              setError("Invalid email or password.");
              return;
            }
            router.replace("/app/dashboard");
            router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </div>
        <FieldError>{authError}</FieldError>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ash">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-ember hover:underline">
          Create your account
        </Link>
      </p>
    </Card>
  );
}

export function RegisterForm({
  recruiterHint,
  googleEnabled = false,
}: {
  recruiterHint?: boolean;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-coal">Join Fireplace</h1>
      <p className="mt-2 text-sm text-ash">
        {recruiterHint
          ? "Create an account, then complete recruiter verification."
          : "A professional community for people affected by layoffs."}
      </p>
      {googleEnabled ? (
        <>
          <div className="mt-6">
            <GoogleSignInButton label="Continue with Google" />
          </div>
          <AuthDivider />
        </>
      ) : (
        <div className="mt-6" />
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!country || !city) {
            setError("Please select city and country.");
            return;
          }
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "").toLowerCase();
          const password = String(fd.get("password") ?? "");
          start(async () => {
            setError(undefined);
            const created = await registerUser(fd);
            if (!created.ok) {
              setError(created.error);
              return;
            }
            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (res?.error) {
              setError("Account created but sign-in failed. Please log in.");
              return;
            }
            router.replace("/onboarding/professional");
            router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SearchableSelect
            name="city"
            label="City"
            options={MAJOR_CITIES}
            value={city}
            onChange={setCity}
            placeholder="Select city…"
            required
          />
          <SearchableSelect
            name="country"
            label="Country"
            options={COUNTRIES}
            value={country}
            onChange={setCountry}
            placeholder="Select country…"
            required
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ash">
        Already have an account?{" "}
        <Link href="/" className="font-semibold text-ember hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
