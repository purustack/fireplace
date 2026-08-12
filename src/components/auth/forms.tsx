"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginUser, registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/multi-select";
import { COUNTRIES, MAJOR_CITIES } from "@/lib/onboarding-options";

export function LoginForm() {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl text-coal">Welcome back</h1>
      <p className="mt-2 text-sm text-ash">Log in to continue rebuilding.</p>
      <form
        className="mt-6 space-y-4"
        action={(fd) => {
          start(async () => {
            try {
              const res = await loginUser(fd);
              if (!res.ok) setError(res.error);
            } catch {
              // Next.js redirect / navigation — ignore
            }
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
        <Button className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ash">
        New here?{" "}
        <Link href="/register" className="font-semibold text-ember">
          Join Fireplace
        </Link>
      </p>
    </Card>
  );
}

export function RegisterForm({ recruiterHint }: { recruiterHint?: boolean }) {
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
        action={(fd) => {
          start(async () => {
            if (!country || !city) {
              setError("Please select city and country.");
              return;
            }
            try {
              const res = await registerUser(fd);
              if (!res.ok) setError(res.error);
              // Success navigates via Auth.js redirectTo
            } catch {
              // Next.js redirect / navigation — ignore
            }
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
        <Button className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ash">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ember">
          Log in
        </Link>
      </p>
    </Card>
  );
}
