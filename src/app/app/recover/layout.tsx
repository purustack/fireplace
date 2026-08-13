import { RecoverNav } from "@/components/recover/recover-nav";

export default function RecoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Recover</p>
        <h1 className="mt-1 font-display text-3xl text-coal md:text-4xl">Not a job board. A next step.</h1>
        <p className="mt-2 max-w-2xl text-ash">
          Private tools for the first stretch after a layoff — paperwork, runway, people from the
          same company, and interview notes. Recruiters don’t see this.
        </p>
      </div>
      <RecoverNav />
      {children}
    </div>
  );
}
