export const SURVEY_EXPECTED = [
  { value: "YES", label: "Yes — I saw it coming" },
  { value: "SOMEWHAT", label: "I had some idea it might happen" },
  { value: "NO", label: "No — it was a shock" },
  { value: "UNSURE", label: "I’m still not sure" },
] as const;

export const SURVEY_REASONS = [
  { value: "ROLE_ELIMINATED", label: "The role or team was eliminated" },
  { value: "COMPANY_FINANCES", label: "Company finances / cost-cutting" },
  { value: "RESTRUCTURE", label: "Reorg or new leadership" },
  { value: "INTERNAL_POLITICS", label: "Internal politics or favoritism" },
  { value: "PERFORMANCE", label: "I was told it was performance-related" },
  { value: "SKILLS_GAP", label: "Skills weren’t a match for where the company is going" },
  { value: "PROJECT_ENDED", label: "The project or product was shut down" },
  { value: "UNCLEAR", label: "They never gave a clear reason" },
  { value: "OTHER", label: "Something else" },
] as const;

export const SURVEY_NOTIFIED = [
  { value: "MANAGER_1ON1", label: "1:1 with my manager" },
  { value: "HR_CALL", label: "HR call or meeting" },
  { value: "EMAIL", label: "Email only" },
  { value: "MASS_MEETING", label: "Mass meeting / town hall" },
  { value: "CHAT", label: "Slack / Teams / chat" },
  { value: "OTHER", label: "Other" },
] as const;

export const SURVEY_TENURE = [
  { value: "UNDER_1", label: "Under 1 year" },
  { value: "Y1_2", label: "1–2 years" },
  { value: "Y3_5", label: "3–5 years" },
  { value: "Y6_10", label: "6–10 years" },
  { value: "OVER_10", label: "10+ years" },
] as const;

export const SURVEY_NOTICE = [
  { value: "NONE", label: "None / same day" },
  { value: "UNDER_2_WEEKS", label: "Under 2 weeks" },
  { value: "TWO_TO_FOUR_WEEKS", label: "2–4 weeks" },
  { value: "ONE_TO_TWO_MONTHS", label: "1–2 months" },
  { value: "OVER_TWO_MONTHS", label: "More than 2 months" },
] as const;

export const SURVEY_SEVERANCE = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "PREFER_NOT", label: "Prefer not to say" },
] as const;

export const SURVEY_SUPPORT = [
  { value: "JOB_SEARCH", label: "Finding open roles" },
  { value: "RESUME", label: "Resume / LinkedIn help" },
  { value: "INTERVIEW_PREP", label: "Interview prep" },
  { value: "SKILLS", label: "Learning new skills" },
  { value: "NETWORKING", label: "Networking & referrals" },
  { value: "PEER_SUPPORT", label: "Talking to people in the same boat" },
] as const;

export type LayoffSurveyAnswers = {
  expected?: (typeof SURVEY_EXPECTED)[number]["value"];
  reasons: Array<(typeof SURVEY_REASONS)[number]["value"]>;
  notifiedHow?: (typeof SURVEY_NOTIFIED)[number]["value"];
  tenure?: (typeof SURVEY_TENURE)[number]["value"];
  notice?: (typeof SURVEY_NOTICE)[number]["value"];
  severance?: (typeof SURVEY_SEVERANCE)[number]["value"];
  supportNeeded: Array<(typeof SURVEY_SUPPORT)[number]["value"]>;
  notes?: string;
};

export function isLayoffSurveyAnswers(value: unknown): value is LayoffSurveyAnswers {
  if (!value || typeof value !== "object") return false;
  const v = value as LayoffSurveyAnswers;
  return Array.isArray(v.reasons) && Array.isArray(v.supportNeeded);
}

export function surveyHasAnswers(s: LayoffSurveyAnswers) {
  return Boolean(
    s.expected ||
      s.reasons.length ||
      s.notifiedHow ||
      s.tenure ||
      s.notice ||
      s.severance ||
      s.supportNeeded.length ||
      s.notes,
  );
}
