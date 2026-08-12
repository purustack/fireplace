import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="bg-hearth min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-2xl text-coal">
          Fireplace
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-ash hover:text-coal">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm">Join Fireplace</Button>
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
            <Link href="/register">
              <Button size="lg">Join Fireplace</Button>
            </Link>
            <Link href="/register?role=recruiter">
              <Button size="lg" variant="secondary">
                I’m a Recruiter
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-smoke/30 bg-warm-white/70 py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 md:grid-cols-3">
            <div>
              <h2 className="font-display text-2xl text-coal">For Professionals</h2>
              <ul className="mt-5 space-y-3 text-ash">
                <li>Find opportunities through community, not cold applications alone</li>
                <li>Connect with people going through the same experience</li>
                <li>Get referrals and discover startup collaborations</li>
                <li>Get noticed by recruiters when you’re ready</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl text-coal">For Recruiters</h2>
              <ul className="mt-5 space-y-3 text-ash">
                <li>Find immediately available talent</li>
                <li>Search verified professionals</li>
                <li>Filter by skills, experience, and availability</li>
                <li>Contact candidates through Fireplace — no public PII</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl text-coal">For Everyone</h2>
              <p className="mt-5 text-ash">
                One person’s next opportunity can come from another person’s
                network. Fireplace is about connection, opportunity,
                collaboration, recovery, and growth.
              </p>
              <p className="mt-4 font-medium text-coal">
                You lost a job. You didn’t lose your career.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-embers py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl text-coal md:text-4xl">
              A place to regroup, reconnect and rebuild.
            </h2>
            <p className="mt-4 text-ash">
              Mark your availability, verify your story with privacy-first
              trust signals, and join a community built for what’s next.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">Start rebuilding</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-smoke/30 px-6 py-8 text-center text-sm text-ash">
        © {new Date().getFullYear()} Fireplace · Built for professionals after layoffs
      </footer>
    </div>
  );
}
