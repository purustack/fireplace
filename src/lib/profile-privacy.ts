/** Never select these on public / recruiter profile queries. */
export const PRIVATE_PROFILE_OMIT = {
  layoffSurvey: true,
  layoffSurveyAt: true,
  hearthOptIn: true,
  companyKey: true,
  kitStartedAt: true,
  kitCompletedIds: true,
  runwaySavings: true,
  runwayMonthlyBurn: true,
  runwayCurrency: true,
  runwayUpdatedAt: true,
} as const;
