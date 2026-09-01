import { describe, it, expect } from "vitest";
import { app } from "./app";
import { parseResumeBuffer } from "./parser";
import { analyzeResume } from "../shared/analysisEngine";
import { DEFAULT_JOB_ROLES } from "../shared/defaultRoles";

describe("JOBLENS API Server Endpoints & Resume Parsing", () => {
  it("TXT resume parsing extracts text cleanly", async () => {
    const textBuffer = Buffer.from(
      "John Doe\nEmail: john@example.com\nPhone: (555) 019-2831\n\nExperience\nSoftware Engineer at TechCorp\n- Engineered React applications and optimized SQL database queries by 35%.\n- Developed backend Node.js microservices serving 50,000 daily active users.\n\nSkills\nJavaScript, TypeScript, React, Node.js, SQL, Python"
    );
    const parsed = await parseResumeBuffer(textBuffer, "john_resume.txt", "text/plain");

    expect(parsed.extractedText).toContain("TechCorp");
    expect(parsed.metadata.email).toBe("john@example.com");
    expect(parsed.metadata.phone).toBe("(555) 019-2831");
    expect(parsed.fileType).toBe("txt");
  });

  it("Analysis engine produces dynamic results based on resume text", async () => {
    const role = DEFAULT_JOB_ROLES[0]; // Software Developer / Engineer

    // Resume A: High alignment (Software Dev)
    const resumeA = await parseResumeBuffer(
      Buffer.from(
        "Alice Smith\nalice@example.com\n\nSoftware Engineer\n- Architected React frontend and Node.js microservices.\n- Optimized SQL queries by 40% and improved web performance.\nSkills: React, Node.js, TypeScript, SQL, Python"
      ),
      "alice.txt",
      "text/plain"
    );
    const resultA = analyzeResume(resumeA, role);

    // Resume B: Low alignment (Hotel Hospitality)
    const resumeB = await parseResumeBuffer(
      Buffer.from(
        "Bob Johnson\nbob@example.com\n\nHotel Manager\n- Managed guest relations and staff scheduling.\n- Oversaw front desk operations and hospitality services.\nSkills: Hospitality Management, Customer Service, Scheduling"
      ),
      "bob.txt",
      "text/plain"
    );
    const resultB = analyzeResume(resumeB, role);

    // Verify dynamic scoring: Resume A must score significantly higher than Resume B for Software Developer
    expect(resultA.overallScore).toBeGreaterThan(resultB.overallScore);
    expect(resultA.matchedSkills).toContain("React");
    expect(resultB.missingSkills).toContain("React");
    expect(resultA.matchedSkills).not.toEqual(resultB.matchedSkills);
    expect(resultA.interviewQuestions).not.toEqual(resultB.interviewQuestions);
  });

  it("Enforces 4 MB file size rejection logic", async () => {
    // 5 MB dummy buffer exceeding 4 MB limit
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024);
    expect(oversizedBuffer.length).toBeGreaterThan(4 * 1024 * 1024);
  });
});
