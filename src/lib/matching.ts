export type MatchCandidate = {
  jobTitle?: string | null;
  yearsExperience?: number | null;
  skills: string[];
};

export type MatchJob = {
  title: string;
  body: string;
  jobMeta?: {
    experienceRange?: string;
    skills?: string[];
    location?: string;
  } | null;
};

/**
 * Simple weighted job matcher for V1 — no ML.
 * Weights: skills 50%, title 30%, experience 20%.
 */
export function scoreJobMatch(candidate: MatchCandidate, job: MatchJob): number {
  const candSkills = candidate.skills.map((s) => s.toLowerCase());
  const jobSkills = (job.jobMeta?.skills ?? []).map((s) => s.toLowerCase());
  const text = `${job.title} ${job.body}`.toLowerCase();

  let skillScore = 0;
  if (jobSkills.length > 0) {
    const hits = jobSkills.filter((s) => candSkills.includes(s)).length;
    skillScore = hits / jobSkills.length;
  } else {
    const hits = candSkills.filter((s) => text.includes(s)).length;
    skillScore = candSkills.length ? Math.min(1, hits / Math.max(3, candSkills.length)) : 0;
  }

  const title = (candidate.jobTitle ?? "").toLowerCase();
  const titleTokens = title.split(/\s+/).filter((t) => t.length > 2);
  const titleHits = titleTokens.filter((t) => job.title.toLowerCase().includes(t)).length;
  const titleScore = titleTokens.length ? titleHits / titleTokens.length : 0;

  let expScore = 0.5;
  const range = job.jobMeta?.experienceRange;
  if (range && candidate.yearsExperience != null) {
    const nums = range.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length >= 2) {
      const [min, max] = nums;
      expScore =
        candidate.yearsExperience >= min && candidate.yearsExperience <= max
          ? 1
          : candidate.yearsExperience >= min - 1 && candidate.yearsExperience <= max + 2
            ? 0.6
            : 0.2;
    }
  }

  return Number((skillScore * 0.5 + titleScore * 0.3 + expScore * 0.2).toFixed(3));
}
