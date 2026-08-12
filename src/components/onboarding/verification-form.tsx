"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestEmploymentEmailOtp,
  confirmEmploymentEmailOtp,
  uploadLayoffDocument,
} from "@/actions/verification";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function VerificationForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [otpSent, setOtpSent] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-ember">
          Step 4 of 4 · Optional but recommended
        </p>
        <h1 className="mt-2 font-display text-3xl text-coal">Build trust</h1>
        <p className="mt-2 text-sm text-ash">
          Employment email and layoff documents are never shown publicly. Only
          moderators can review uploaded documentation.
        </p>
      </Card>

      <Card>
        <h2 className="font-display text-xl">Level 1 — Employment email</h2>
        <form
          className="mt-4 space-y-3"
          action={(fd) => {
            start(async () => {
              const res = await requestEmploymentEmailOtp(fd);
              if (!res.ok) setError(res.error);
              else {
                setOtpSent(true);
                setError(undefined);
              }
            });
          }}
        >
          <div>
            <Label htmlFor="employmentEmail">Company email</Label>
            <Input
              id="employmentEmail"
              name="employmentEmail"
              type="email"
              placeholder="you@company.com"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Send OTP
          </Button>
        </form>
        {otpSent ? (
          <form
            className="mt-4 space-y-3"
            action={(fd) => {
              start(async () => {
                const res = await confirmEmploymentEmailOtp(fd);
                if (!res.ok) setError(res.error);
                else setError(undefined);
              });
            }}
          >
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input id="otp" name="otp" maxLength={6} placeholder="6-digit code" />
              <p className="mt-1 text-xs text-ash">
                In development, the OTP is printed in the server console.
              </p>
            </div>
            <Button type="submit" disabled={pending}>
              Verify employment email
            </Button>
          </form>
        ) : null}
      </Card>

      <Card>
        <h2 className="font-display text-xl">Level 2 — Layoff documentation</h2>
        <p className="mt-2 text-sm text-ash">
          Upload a PDF termination, separation, or severance letter from your
          organisation. Images are not accepted. Documents stay private — only
          moderators can review them. The{" "}
          <strong>Layoff Verified</strong> badge appears only after this PDF is
          uploaded and approved.
        </p>
        <form
          className="mt-4 space-y-3"
          action={(fd) => {
            start(async () => {
              const res = await uploadLayoffDocument(fd);
              if (!res.ok) setError(res.error);
              else setError(undefined);
            });
          }}
        >
          <Input
            name="document"
            type="file"
            accept="application/pdf,.pdf"
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            Upload PDF for review
          </Button>
        </form>
      </Card>

      <FieldError>{error}</FieldError>
      <Button
        className="w-full"
        onClick={() => router.push("/app/dashboard")}
        disabled={pending}
      >
        Enter Fireplace
      </Button>
    </div>
  );
}
