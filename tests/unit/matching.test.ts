import { describe, expect, it } from "vitest";
import { scoreJobMatch } from "@/lib/matching";
import { slugify, formatAvailabilityLabel } from "@/lib/utils";

describe("scoreJobMatch", () => {
  it("scores higher when skills and title align", () => {
    const score = scoreJobMatch(
      {
        jobTitle: "QA Automation Engineer",
        yearsExperience: 7,
        skills: ["Playwright", "Python", "API Testing"],
      },
      {
        title: "QA Automation Engineer",
        body: "Hiring for Playwright Python automation",
        jobMeta: {
          skills: ["Playwright", "Python"],
          experienceRange: "3-6 years",
        },
      },
    );
    expect(score).toBeGreaterThan(0.5);
  });
});

describe("utils", () => {
  it("slugifies names", () => {
    expect(slugify("QA Automation")).toBe("qa-automation");
  });

  it("formats availability labels", () => {
    expect(formatAvailabilityLabel("AVAILABLE_IMMEDIATELY")).toContain(
      "Available Immediately",
    );
  });
});
