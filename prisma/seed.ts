/**
 * DEVELOPMENT SEED DATA — not for production.
 * Creates ~20 candidates, 5 recruiters, posts, comments, and groups.
 */
import { PrismaClient, Role, LayoffStatusType, PostCategory, JobPostStatus, WorkPreference } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const skills = [
  "Playwright",
  "Python",
  "API Testing",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "AWS",
  "Product Management",
  "Figma",
  "Java",
  "Kubernetes",
  "Data Analysis",
  "Sales",
  "Customer Success",
];

const titles = [
  "Software Engineer",
  "QA Automation Engineer",
  "Product Manager",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Scientist",
  "UX Designer",
  "DevOps Engineer",
  "SDET",
  "Engineering Manager",
];

const cities = [
  ["Jaipur", "India"],
  ["Bangalore", "India"],
  ["Hyderabad", "India"],
  ["Pune", "India"],
  ["Remote", "India"],
  ["Austin", "USA"],
  ["Berlin", "Germany"],
];

async function upsertSkill(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return prisma.skill.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
}

async function main() {
  console.log("Seeding Fireplace development data…");

  for (const s of skills) {
    await upsertSkill(s);
  }

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@fireplace.dev" },
    create: {
      email: "admin@fireplace.dev",
      name: "Fireplace Admin",
      passwordHash,
      roles: [Role.ADMIN, Role.MODERATOR],
      emailVerified: new Date(),
      onboardingStep: 4,
      profile: {
        create: {
          username: "fireplace-admin",
          jobTitle: "Platform Admin",
          city: "Remote",
          country: "India",
          yearsExperience: 10,
          industry: "Technology",
          layoffStatus: LayoffStatusType.AVAILABLE_IMMEDIATELY,
          profileCompleteness: 100,
          about: "Development admin account.",
        },
      },
      verification: { create: { personalEmailVerified: true, layoffDocStatus: "PENDING" } },
    },
    update: {},
  });

  // 20 candidates
  for (let i = 1; i <= 20; i++) {
    const [city, country] = cities[i % cities.length];
    const title = titles[i % titles.length];
    const immediate = i % 3 !== 0;
    const email = `candidate${i}@fireplace.dev`;
    const name = `Candidate ${i}`;
    const username = `candidate-${i}`;

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        roles: [Role.USER],
        emailVerified: new Date(),
        onboardingStep: 4,
        recruiterVisibility: true,
        profile: {
          create: {
            username,
            jobTitle: title,
            previousCompany: `Company ${((i % 8) + 1)}`,
            yearsExperience: 2 + (i % 10),
            industry: "Technology",
            city,
            country,
            workPreference: i % 2 === 0 ? WorkPreference.REMOTE : WorkPreference.HYBRID,
            lookingFor: [`${title} roles`, "Remote opportunities"],
            about: `Development seed profile for ${name}. Laid off and rebuilding.`,
            layoffStatus: immediate
              ? LayoffStatusType.AVAILABLE_IMMEDIATELY
              : LayoffStatusType.SERVING_NOTICE,
            lastWorkingDay: immediate ? null : new Date("2026-09-01"),
            expectedAvailabilityDate: immediate ? null : new Date("2026-09-15"),
            profileCompleteness: 80,
          },
        },
        verification: {
          create: {
            personalEmailVerified: true,
            employmentEmailVerified: i % 4 === 0,
            // Badge requires an uploaded+approved PDF — do not mark VERIFIED without a document.
            layoffDocStatus: i % 5 === 0 ? "VERIFIED" : "PENDING",
            ...(i % 5 === 0
              ? {
                  documents: {
                    create: {
                      storageKey: `verification/seed/candidate-${i}-termination.pdf`,
                      fileName: `termination-letter-candidate-${i}.pdf`,
                      mimeType: "application/pdf",
                      sizeBytes: 12_345,
                      status: "VERIFIED",
                      reviewedAt: new Date(),
                      reviewNotes: "Development seed — verified termination letter PDF",
                    },
                  },
                }
              : {}),
          },
        },
      },
      update: {},
      include: { profile: true },
    });

    const skillNames = [skills[i % skills.length], skills[(i + 2) % skills.length], skills[(i + 5) % skills.length]];
    for (const [idx, skillName] of skillNames.entries()) {
      const skill = await upsertSkill(skillName);
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: user.id, skillId: skill.id } },
        create: {
          userId: user.id,
          skillId: skill.id,
          type: idx === 0 ? "PRIMARY" : "SECONDARY",
        },
        update: {},
      });
    }
  }

  // 5 recruiters
  for (let i = 1; i <= 5; i++) {
    const email = `recruiter${i}@fireplace.dev`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: `Recruiter ${i}`,
        passwordHash,
        roles: [Role.RECRUITER, Role.USER],
        emailVerified: new Date(),
        onboardingStep: 4,
        profile: {
          create: {
            username: `recruiter-${i}`,
            jobTitle: "Talent Acquisition",
            city: "Bangalore",
            country: "India",
            industry: "Recruiting",
            yearsExperience: 5,
            layoffStatus: LayoffStatusType.AVAILABLE_IMMEDIATELY,
            profileCompleteness: 60,
          },
        },
        verification: { create: { personalEmailVerified: true } },
        recruiterProfile: {
          create: {
            companyName: `HireCo ${i}`,
            jobTitle: "Senior Recruiter",
            companyWebsite: `https://hireco${i}.example`,
            linkedinUrl: `https://linkedin.com/in/recruiter${i}`,
            companyEmail: `talent@hireco${i}.example`,
            verified: i <= 3,
            bio: "Development seed recruiter.",
          },
        },
      },
      update: {},
    });
    void user;
  }

  const authors = await prisma.user.findMany({
    where: { email: { startsWith: "candidate" } },
    take: 10,
  });

  const categories: PostCategory[] = [
    PostCategory.JOB_OPPORTUNITY,
    PostCategory.REFERRAL,
    PostCategory.DISCUSSION,
    PostCategory.CAREER_ADVICE,
    PostCategory.NEED_HELP,
    PostCategory.SUCCESS_STORY,
    PostCategory.LEARNING,
    PostCategory.STARTUP_IDEA,
  ];

  for (let i = 0; i < 12; i++) {
    const author = authors[i % authors.length];
    const category = categories[i % categories.length];
    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        category,
        title:
          category === PostCategory.JOB_OPPORTUNITY
            ? `Hiring: QA Automation Engineers (${i + 1})`
            : `Community post ${i + 1}: rebuilding together`,
        body:
          category === PostCategory.JOB_OPPORTUNITY
            ? "My new company is hiring. Experience 3–6 years. Skills: Playwright, Python. Location: Remote. DM me if interested."
            : "Sharing experience and looking to support others in the Fireplace community.",
        jobStatus: category === PostCategory.JOB_OPPORTUNITY ? JobPostStatus.OPEN : null,
        jobMeta:
          category === PostCategory.JOB_OPPORTUNITY
            ? {
                experienceRange: "3-6 years",
                skills: ["Playwright", "Python"],
                location: "Remote",
              }
            : undefined,
      },
    });

    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: authors[(i + 1) % authors.length].id,
        body: "Thanks for sharing — happy to help or connect.",
      },
    });
  }

  const groupDefs = [
    ["qa-engineers", "QA Engineers"],
    ["software-developers", "Software Developers"],
    ["jaipur-professionals", "Jaipur Professionals"],
    ["startup-builders", "Startup Builders"],
    ["remote-workers", "Remote Workers"],
  ];

  for (const [slug, name] of groupDefs) {
    await prisma.group.upsert({
      where: { slug },
      create: {
        slug,
        name,
        description: `Development seed group: ${name}`,
        isPublic: true,
      },
      update: {},
    });
  }

  console.log("Seed complete.");
  console.log("Admin: admin@fireplace.dev / Password123!");
  console.log("Candidates: candidate1@fireplace.dev … candidate20@fireplace.dev / Password123!");
  console.log("Recruiters: recruiter1@fireplace.dev … recruiter5@fireplace.dev / Password123!");
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
