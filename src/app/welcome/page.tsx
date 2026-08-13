import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="bg-hearth min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl text-coal">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-warm-white">
            <Flame className="h-4 w-4" />
          </span>
          Fireplace
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/" className="text-sm font-medium text-ash hover:text-coal">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm">Create account</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col justify-center px-6 pb-16 pt-8">
          <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-[420px] max-w-4xl rounded-full bg-ember/10 blur-3xl animate-glow" />
          <p className="animate-fade-in text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Professional community
          </p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-coal md:text-7xl">
            Fireplace
          </h1>
          <p className="animate-rise mt-5 max-w-2xl font-display text-2xl text-ember-deep md:text-3xl">
            When one door closes, we build another.
          </p>
          <p className="animate-rise mt-6 max-w-xl text-lg text-ash">
            A professional community for people affected by layoffs to connect,
            support each other, discover opportunities, and build what’s next.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap gap-3">
            <Link href="/">
              <Button size="lg">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create account
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
