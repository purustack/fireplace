"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/multi-select";
import { COUNTRIES, MAJOR_CITIES } from "@/lib/onboarding-options";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-coal">Welcome back</h1>
      <p className="mt-2 text-sm text-ash">Log in to continue rebuilding.</p>
      <form
        className="mt-6 space-y-4"
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
        <FieldError>{error}</FieldError>
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

export function RegisterForm({ recruiterHint }: { recruiterHint?: boolean }) {
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
      <form
        className="mt-6 space-y-4"
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
