import { describe, it, expect } from "vitest";
import { analyzeResume } from "../shared/analysisEngine";
import { ParsedResume, JobRole } from "../shared/types";

const softwareRole: JobRole = {
  id: "role-1",
  title: "Software Engineer",
  company: "TechCorp",
  category: "Engineering",
  description: "Build scale web services using React, Node.js, and SQL.",
  requiredSkills: ["React", "Node.js", "TypeScript", "SQL"],
  preferredSkills: ["GraphQL", "Docker"],
  experienceLevel: "Mid Level",
  location: "Remote",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const hotelRole: JobRole = {
  id: "role-2",
  title: "Hotel Operations Manager",
  company: "Grand Stay",
  category: "Hospitality",
  description: "Manage hotel guest relations, scheduling, and staff.",
  requiredSkills: ["Hospitality Management", "Customer Service", "Scheduling"],
  preferredSkills: ["Financial Analysis"],
  experienceLevel: "Senior",
  location: "On-site",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const softwareResume: ParsedResume = {
  resumeId: "res-1",
  filename: "alex_dev.pdf",
  fileType: "pdf",
  fileSize: 1024,
  extractedText: `
    Alex Developer
    alex@dev.com | 555-0199 | San Francisco, CA | github.com/alexdev
    Summary: Passionate Software Engineer with 4 years of experience building applications with React, Node.js, and SQL.
    Experience:
    Software Engineer - Tech Solutions (2020 - Present)
    - Developed a React dashboard that reduced manual reporting time by 30%.
    - Built Node.js microservices serving 100,000 active users with 99.9% uptime.
    - Optimized PostgreSQL database queries, reducing latency by 45%.
    Education:
    B.S. in Computer Science - State University (2020)
    Skills: React, Node.js, TypeScript, SQL, JavaScript, Git
  `,
  metadata: {
    name: "Alex Developer",
    email: "alex@dev.com",
    phone: "555-0199",
    location: "San Francisco, CA",
    github: "github.com/alexdev",
  },
  sections: {
    summary: "Passionate Software Engineer with 4 years of experience...",
    skills: ["React", "Node.js", "TypeScript", "SQL", "JavaScript", "Git"],
    experience: [
      "Developed a React dashboard that reduced manual reporting time by 30%.",
      "Built Node.js microservices serving 100,000 active users with 99.9% uptime.",
    ],
    education: ["B.S. in Computer Science - State University (2020)"],
    projects: [],
    certifications: [],
  },
};

const weakResume: ParsedResume = {
  resumeId: "res-weak",
  filename: "minimal.pdf",
  fileType: "pdf",
  fileSize: 500,
  extractedText: "John Doe\nLooking for work.\nSkills: Python",
  metadata: {
    name: "John Doe",
  },
  sections: {
    skills: ["Python"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  },
};

describe("Analysis Engine — Dynamic Resume Quality & Match Logic", () => {
  it("computes strong score for Software Engineer resume against Software Role", () => {
    const res = analyzeResume(softwareResume, softwareRole);
    expect(res.overallScore).toBeGreaterThanOrEqual(75);
    expect(res.matchedSkills).toContain("React");
    expect(res.matchedSkills).toContain("Node.js");
    expect(res.overallResumeQuality).toBeGreaterThanOrEqual(70);
    expect(res.quantifiedAchievementsCount).toBeGreaterThanOrEqual(2);
    expect(res.actionVerbsCount).toBeGreaterThanOrEqual(2);
  });

  it("computes lower match score for Software Engineer resume against Hotel Manager Role", () => {
    const resSoftwareRole = analyzeResume(softwareResume, softwareRole);
    const resHotelRole = analyzeResume(softwareResume, hotelRole);

    // Hiring readiness match for Hotel role should be significantly lower than Software role
    expect(resHotelRole.overallScore).toBeLessThan(resSoftwareRole.overallScore);
    expect(resHotelRole.missingSkills).toContain("Hospitality Management");
    expect(resHotelRole.missingSkills).toContain("Customer Service");
  });

  it("handles minimal/weak resume with dynamic improvements and lower scores", () => {
    const res = analyzeResume(weakResume, softwareRole);
    expect(res.overallResumeQuality).toBeLessThan(60);
    expect(res.improvements.length).toBeGreaterThanOrEqual(3);

    const hasMissingContact = res.improvements.some((i) => i.title.includes("Contact"));
    const hasQuantifiedImp = res.improvements.some((i) => i.title.includes("Quantified"));
    expect(hasMissingContact || hasQuantifiedImp).toBe(true);
  });

  it("guarantees all scores are strictly deterministic between 0 and 100 without NaN", () => {
    const res1 = analyzeResume(softwareResume, softwareRole);
    const res2 = analyzeResume(softwareResume, softwareRole);

    expect(res1.overallScore).toBe(res2.overallScore);
    expect(res1.overallResumeQuality).toBe(res2.overallResumeQuality);
    expect(res1.resumeQuality.content.score).toBeGreaterThanOrEqual(0);
    expect(res1.resumeQuality.content.score).toBeLessThanOrEqual(100);
    expect(res1.resumeQuality.flow.score).toBeGreaterThanOrEqual(0);
    expect(res1.resumeQuality.flow.score).toBeLessThanOrEqual(100);
    expect(res1.resumeQuality.presentation.score).toBeGreaterThanOrEqual(0);
    expect(res1.resumeQuality.presentation.score).toBeLessThanOrEqual(100);
    expect(res1.resumeQuality.ats.score).toBeGreaterThanOrEqual(0);
    expect(res1.resumeQuality.ats.score).toBeLessThanOrEqual(100);
    expect(Number.isNaN(res1.overallScore)).toBe(false);
  });
});
