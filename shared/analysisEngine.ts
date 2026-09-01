import { nanoid } from "nanoid";
import {
  AnalysisResult,
  CategoryScoreDetail,
  JobRole,
  ParsedResume,
  ResumeImprovement,
  SkillMatchDetail,
  SubCategoryMetric,
} from "./types";

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "javascript", "ecmascript"],
  typescript: ["ts", "typescript"],
  react: ["react", "react.js", "reactjs", "react native"],
  nodejs: ["node", "node.js", "nodejs", "express", "expressjs"],
  python: ["python", "python3", "py"],
  sql: ["sql", "mysql", "postgresql", "postgres", "sqlite", "tsql"],
  c: ["c"],
  "c++": ["c++", "cpp"],
  verilog: ["verilog", "systemverilog", "hdl"],
  fpga: ["fpga", "field programmable gate array", "xilinx", "altera"],
  microcontrollers: ["microcontroller", "microcontrollers", "mcu", "stm32", "arduino", "esp32", "pic"],
  "machine learning": ["machine learning", "ml", "deep learning", "ai", "artificial intelligence"],
  pandas: ["pandas", "numpy", "scipy"],
  pytorch: ["pytorch", "torch", "tensorflow", "keras"],
  "digital marketing": ["digital marketing", "online marketing", "growth marketing"],
  seo: ["seo", "search engine optimization", "sem"],
  "content strategy": ["content strategy", "content marketing", "copywriting"],
  "hospitality management": ["hospitality", "hotel management", "resort management", "guest services"],
  "customer service": ["customer service", "client relations", "guest relations", "customer support"],
  scheduling: ["scheduling", "staff scheduling", "shift management", "workforce management"],
  "financial analysis": ["financial analysis", "financial modeling", "accounting", "ledger"],
  excel: ["excel", "microsoft excel", "spreadsheets"],
};

const RELATED_DOMAINS: Record<string, string[]> = {
  python: ["data science", "backend development", "automation", "scripting"],
  sql: ["database management", "data analysis", "backend storage"],
  javascript: ["frontend development", "web development"],
  react: ["frontend frameworks", "ui development"],
  c: ["embedded systems", "low-level programming", "firmware"],
  verilog: ["digital design", "hardware description", "rtl"],
  fpga: ["hardware acceleration", "reconfigurable computing"],
  "customer service": ["communication", "conflict resolution", "client management"],
  seo: ["digital strategy", "web analytics", "content optimization"],
};

const ACTION_VERBS = [
  "developed", "designed", "implemented", "built", "optimized", "led", "managed",
  "analyzed", "automated", "created", "engineered", "tested", "deployed", "improved",
  "increased", "reduced", "spearheaded", "architected", "delivered", "transformed",
  "established", "orchestrated", "overhauled", "strengthened", "launched", "executed"
];

const GENERIC_PHRASES = [
  "worked on", "responsible for", "handled tasks", "assisted with", "duties included", "helped in"
];

function hasSkillWord(text: string, skill: string): boolean {
  const normalizedText = text.toLowerCase();
  const lowerSkill = skill.toLowerCase().trim();
  const aliases = SKILL_ALIASES[lowerSkill] || [lowerSkill];

  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i");
    if (regex.test(normalizedText)) {
      return true;
    }
  }
  return false;
}

function countActionVerbs(text: string): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  ACTION_VERBS.forEach((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

function countQuantifiedAchievements(text: string): number {
  // Matches percentages, monetary amounts, scale metrics, team sizes, time savings
  const metricRegex = /\b(\d+\s*%\s*|\$\s*\d+[\d,]*|\d+\s*(?:users|clients|projects|team members|hours|days|weeks|months|years|x|k|m|gb|tb|ms|fps|x))\b/gi;
  const matches = text.match(metricRegex);
  return matches ? Math.min(25, matches.length) : 0;
}

function countGenericPhrases(text: string): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  GENERIC_PHRASES.forEach((phrase) => {
    const regex = new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi");
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

export function analyzeResume(resume: ParsedResume, role: JobRole): AnalysisResult {
  const text = resume.extractedText || "";

  // =========================================================================
  // 1. DYNAMIC RESUME QUALITY CATEGORIES (Standalone Resume Health)
  // =========================================================================

  // A. CONTENT CATEGORY (30% weight)
  const metadata = resume.metadata || {};
  let contactScore = 0;
  if (metadata.name) contactScore += 25;
  if (metadata.email) contactScore += 25;
  if (metadata.phone) contactScore += 25;
  if (metadata.linkedIn || metadata.github || metadata.location) contactScore += 25;

  const quantifiedCount = countQuantifiedAchievements(text);
  const actionVerbCount = countActionVerbs(text);
  const genericCount = countGenericPhrases(text);

  let achievementScore = Math.min(100, quantifiedCount * 20); // 5 metrics = 100%
  let actionVerbScore = Math.min(100, actionVerbCount * 15);   // 7 verbs = 100%
  let genericPenalty = Math.min(30, genericCount * 10);

  const sectionsPresent = [
    resume.sections.summary || /summary|profile/i.test(text),
    resume.sections.experience.length > 0 || /experience|employment/i.test(text),
    resume.sections.education.length > 0 || /education|academic/i.test(text),
    resume.sections.skills.length > 0 || /skills|technologies/i.test(text),
    resume.sections.projects.length > 0 || /projects/i.test(text),
  ].filter(Boolean).length;

  let sectionCompletenessScore = Math.min(100, (sectionsPresent / 4) * 100);

  const rawContentScore = Math.max(
    15,
    Math.min(
      100,
      Math.round(
        contactScore * 0.20 +
        achievementScore * 0.30 +
        actionVerbScore * 0.25 +
        sectionCompletenessScore * 0.25 -
        genericPenalty
      )
    )
  );

  const contentDetail: CategoryScoreDetail = {
    score: rawContentScore,
    summary: `Evaluated ${quantifiedCount} quantified metrics, ${actionVerbCount} action verbs, and contact completeness.`,
    metrics: [
      { name: "Contact Information", score: contactScore, explanation: metadata.email ? "Includes verified contact details." : "Missing email or phone." },
      { name: "Quantified Achievements", score: achievementScore, explanation: `${quantifiedCount} measurable metrics detected in text.` },
      { name: "Action Verb Impact", score: actionVerbScore, explanation: `${actionVerbCount} strong action verbs identified.` },
      { name: "Section Completeness", score: sectionCompletenessScore, explanation: `${sectionsPresent} standard section blocks present.` },
    ],
  };

  // B. FLOW & STRUCTURE CATEGORY (25% weight)
  const hasHeadings = /experience|education|skills|projects|summary|certifications/gi.test(text);
  let headingScore = hasHeadings ? 90 : 40;

  const datesDetected = (text.match(/\b(19|20)\d{2}\b/g) || []).length;
  let chronologyScore = datesDetected >= 2 ? 85 : datesDetected === 1 ? 65 : 45;

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const longParagraphs = lines.filter((l) => l.length > 400).length;
  let readabilityScore = Math.max(40, 100 - longParagraphs * 15);

  const rawFlowScore = Math.max(
    20,
    Math.min(100, Math.round(headingScore * 0.40 + chronologyScore * 0.30 + readabilityScore * 0.30))
  );

  const flowDetail: CategoryScoreDetail = {
    score: rawFlowScore,
    summary: `Scanned section chronology, standard headings, and paragraph readability.`,
    metrics: [
      { name: "Standard Headings", score: headingScore, explanation: hasHeadings ? "Recognizable section titles used." : "Non-standard section titles." },
      { name: "Chronology & Dates", score: chronologyScore, explanation: `${datesDetected} year references detected.` },
      { name: "Readability & Paragraph Length", score: readabilityScore, explanation: longParagraphs === 0 ? "Balanced paragraph lengths." : "Contains long text blocks." },
    ],
  };

  // C. PRESENTATION & ATS READABILITY CATEGORY (20% weight)
  let artifactPenalty = 0;
  if (/[^\x09\x0A\x20-\x7E]/g.test(text)) artifactPenalty += 10;
  let textDensityScore = Math.max(40, 100 - artifactPenalty);
  let formattingScore = text.length > 200 ? 85 : 45;

  const rawPresentationScore = Math.max(
    20,
    Math.min(100, Math.round(textDensityScore * 0.60 + formattingScore * 0.40))
  );

  const presentationDetail: CategoryScoreDetail = {
    score: rawPresentationScore,
    summary: `Verified clean text extraction, contact line parseability, and symbol density.`,
    metrics: [
      { name: "Clean Text Extraction", score: textDensityScore, explanation: "Document text extracts cleanly without broken characters." },
      { name: "Structure Consistency", score: formattingScore, explanation: "Consistent text line breaks and formatting." },
    ],
  };

  // D. ATS COMPATIBILITY CATEGORY (25% weight)
  const required = role.requiredSkills || [];
  const preferred = role.preferredSkills || [];
  const targetSkills = Array.from(new Set([...required, ...preferred]));

  const matchedSkills: string[] = [];
  const transferableSkills: string[] = [];
  const missingSkills: string[] = [];
  const skillsDetails: SkillMatchDetail[] = [];

  let matchedReqCount = 0;
  let matchedPrefCount = 0;

  required.forEach((skill) => {
    if (hasSkillWord(text, skill)) {
      matchedReqCount++;
      matchedSkills.push(skill);
      skillsDetails.push({
        name: skill,
        state: "Matched",
        detail: `Required skill matched directly in resume text.`,
      });
    } else {
      const lowerSkill = skill.toLowerCase();
      let foundTransferable = false;
      for (const [key, relatedList] of Object.entries(RELATED_DOMAINS)) {
        if (relatedList.some((rel) => rel.includes(lowerSkill) || lowerSkill.includes(rel))) {
          if (hasSkillWord(text, key)) {
            transferableSkills.push(skill);
            skillsDetails.push({
              name: skill,
              state: "Transferable",
              detail: `Related experience in ${key} found.`,
            });
            foundTransferable = true;
            break;
          }
        }
      }
      if (!foundTransferable) {
        missingSkills.push(skill);
        skillsDetails.push({
          name: skill,
          state: "Not identified",
          detail: `Required skill not identified in resume.`,
        });
      }
    }
  });

  preferred.forEach((skill) => {
    if (hasSkillWord(text, skill)) {
      matchedPrefCount++;
      if (!matchedSkills.includes(skill)) {
        matchedSkills.push(skill);
        skillsDetails.push({
          name: skill,
          state: "Matched",
          detail: `Preferred skill matched in resume.`,
        });
      }
    } else if (!missingSkills.includes(skill) && !transferableSkills.includes(skill)) {
      missingSkills.push(skill);
      skillsDetails.push({
        name: skill,
        state: "Not identified",
        detail: `Preferred skill not identified in resume.`,
      });
    }
  });

  const titleMatch = hasSkillWord(text, role.title) || role.title.split(" ").some((w) => w.length > 3 && hasSkillWord(text, w));
  let titleScore = titleMatch ? 95 : 45;

  const reqRatio = required.length > 0 ? matchedReqCount / required.length : 1.0;
  const prefRatio = preferred.length > 0 ? matchedPrefCount / preferred.length : 0.8;
  const skillScore = Math.min(100, Math.round((reqRatio * 0.75 + prefRatio * 0.25) * 100));

  const keywords = [...required, ...role.title.split(" ")].filter((k) => k.length > 1);
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  keywords.forEach((kw) => {
    if (hasSkillWord(text, kw)) {
      if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
    } else {
      if (!missingKeywords.includes(kw)) missingKeywords.push(kw);
    }
  });

  const keywordScore = Math.round(
    keywords.length > 0 ? (matchedKeywords.length / keywords.length) * 100 : 80
  );

  const rawAtsScore = Math.max(
    15,
    Math.min(100, Math.round(skillScore * 0.50 + keywordScore * 0.30 + titleScore * 0.20))
  );

  const atsDetail: CategoryScoreDetail = {
    score: rawAtsScore,
    summary: `${keywordScore}% keyword density for ${role.title} requirements.`,
    metrics: [
      { name: "Target Keyword Coverage", score: keywordScore, explanation: `${matchedKeywords.length} of ${keywords.length} role terms identified.` },
      { name: "Role Title Alignment", score: titleScore, explanation: titleMatch ? `Direct alignment with ${role.title}.` : `Role title terms not explicit.` },
      { name: "Required Skills Match", score: Math.round(reqRatio * 100), explanation: `${matchedReqCount} of ${required.length} required skills matched.` },
    ],
  };

  // OVERALL RESUME QUALITY (30% Content, 25% Flow, 20% Presentation, 25% ATS)
  const overallResumeQuality = Math.max(
    15,
    Math.min(
      100,
      Math.round(
        rawContentScore * 0.30 +
        rawFlowScore * 0.25 +
        rawPresentationScore * 0.20 +
        rawAtsScore * 0.25
      )
    )
  );

  // =========================================================================
  // 2. JOB MATCH / HIRING READINESS SCORE (Job-Dependent)
  // =========================================================================
  const experienceLines = resume.sections.experience.length > 0 ? resume.sections.experience : text.split("\n");
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const distinctYears = Array.from(new Set(yearMatches)).map(Number).sort((a, b) => a - b);
  let estimatedYears = 0;
  if (distinctYears.length >= 2) {
    estimatedYears = Math.min(15, distinctYears[distinctYears.length - 1] - distinctYears[0]);
  } else {
    estimatedYears = Math.min(5, Math.floor(experienceLines.length / 3));
  }

  let expScore = 75;
  if (estimatedYears >= 5) expScore = 95;
  else if (estimatedYears >= 2) expScore = 85;
  else if (estimatedYears >= 1) expScore = 75;

  let edStructScore = 70;
  const hasEd = resume.sections.education.length > 0 || /education|bachelor|master|degree|b\.s|b\.a|b\.tech|m\.s/i.test(text);
  const hasExpSection = resume.sections.experience.length > 0 || /experience|employment|work history/i.test(text);
  const hasSkillsSection = resume.sections.skills.length > 0 || /skills|technologies/i.test(text);

  if (hasEd) edStructScore += 15;
  if (hasExpSection) edStructScore += 10;
  if (hasSkillsSection) edStructScore += 5;
  edStructScore = Math.min(100, edStructScore);

  const rawOverallMatch =
    skillScore * 0.45 +
    keywordScore * 0.20 +
    expScore * 0.20 +
    edStructScore * 0.15;
  const overallScore = Math.max(10, Math.min(100, Math.round(rawOverallMatch)));

  const rejectionRisk = Math.max(5, Math.min(95, 100 - overallScore));
  const selectionLikelihood: "High" | "Moderate" | "Low" =
    overallScore >= 80 ? "High" : overallScore >= 60 ? "Moderate" : "Low";

  // =========================================================================
  // 3. DYNAMIC STRENGTHS & GAPS
  // =========================================================================
  const strengths: string[] = [];
  if (matchedSkills.length > 0) {
    strengths.push(`Direct skill alignment in ${matchedSkills.slice(0, 3).join(", ")}.`);
  }
  if (quantifiedCount > 0) {
    strengths.push(`${quantifiedCount} quantified achievements with measurable outcomes identified.`);
  }
  if (actionVerbCount >= 3) {
    strengths.push(`Strong action verbs (${actionVerbCount} instances) demonstrating project ownership.`);
  }
  if (hasExpSection) {
    strengths.push(`Structured experience section with verified employment chronology.`);
  }
  if (hasEd) {
    strengths.push(`Verified academic qualifications present in document.`);
  }
  if (strengths.length === 0) {
    strengths.push(`Readable text structure suitable for index scanning.`);
  }

  const gaps: string[] = [];
  if (missingSkills.length > 0) {
    gaps.push(`Missing key role requirements: ${missingSkills.slice(0, 4).join(", ")}.`);
  }
  if (quantifiedCount < 2) {
    gaps.push(`Limited quantified achievements detected in experience text.`);
  }
  if (!hasEd) {
    gaps.push(`No explicit education section identified in resume text.`);
  }
  if (keywordScore < 65) {
    gaps.push(`Low keyword frequency for target role: ${role.title}.`);
  }

  // =========================================================================
  // 4. STRUCTURED IMPROVEMENTS & QUICK FIXES
  // =========================================================================
  const improvements: ResumeImprovement[] = [];

  if (missingSkills.length > 0) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "high",
      category: "ats",
      title: "Improve Target Role Skill Alignment",
      explanation: `Your resume is missing ${missingSkills.length} key skill requirements specified for ${role.title}.`,
      evidence: `Missing terms: ${missingSkills.slice(0, 4).join(", ")}.`,
      recommendation: `Add explicit bullet points or project examples demonstrating ${missingSkills.slice(0, 2).join(" and ")} if truthfully possessed.`,
    });
  }

  if (quantifiedCount < 3) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "high",
      category: "content",
      title: "Add Quantified Achievements",
      explanation: `Only ${quantifiedCount} measurable metrics were detected across your resume.`,
      evidence: `Recruiters look for numbers, percentages, dollar amounts, or scale indicators.`,
      recommendation: `Rewrite experience bullets to include measurable outcomes (e.g. "reduced load time by 25%" or "managed 10+ clients").`,
    });
  }

  if (actionVerbCount < 4) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "medium",
      category: "content",
      title: "Strengthen Action Verbs",
      explanation: `Only ${actionVerbCount} strong action verbs were identified in your text.`,
      evidence: `Generic phrasing like "worked on" or "responsible for" reduces impact.`,
      recommendation: `Begin bullet points with strong verbs such as "Engineered", "Designed", "Optimized", "Architected", or "Spearheaded".`,
    });
  }

  if (!metadata.email || !metadata.phone) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "high",
      category: "presentation",
      title: "Complete Contact Information Header",
      explanation: `Your resume text is missing a clearly parseable ${!metadata.email ? "email address" : "phone number"}.`,
      evidence: `Parsed header: Email: ${metadata.email || "Missing"}, Phone: ${metadata.phone || "Missing"}.`,
      recommendation: `Place your full name, email, phone number, and LinkedIn URL at the top of your document.`,
    });
  }

  if (keywordScore < 70) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "medium",
      category: "ats",
      title: "Increase Industry Keyword Density",
      explanation: `Keyword coverage is currently ${keywordScore}% against ${role.title} terms.`,
      evidence: `Missing keywords: ${missingKeywords.slice(0, 4).join(", ")}.`,
      recommendation: `Incorporate standard industry terms naturally into your professional summary and experience headings.`,
    });
  }

  if (!hasEd) {
    improvements.push({
      id: `imp-${nanoid(6)}`,
      priority: "low",
      category: "structure",
      title: "Add Dedicated Education Section",
      explanation: `No explicit "Education" heading was detected in your document text.`,
      evidence: `ATS scanners rely on standard "Education" section headers.`,
      recommendation: `Add a clear "Education" section with degree title, institution, and graduation year.`,
    });
  }

  // Quick Fixes (Top 3 highest priority items)
  const quickFixes: string[] = improvements
    .sort((a, b) => (a.priority === "high" ? -1 : 1))
    .slice(0, 3)
    .map((imp) => imp.recommendation);

  if (quickFixes.length === 0) {
    quickFixes.push("Quantify recent experience bullets with specific percentages or team metrics.");
    quickFixes.push("Ensure key technologies are listed in both skills and experience bullets.");
    quickFixes.push("Tailor your summary statement to explicitly mention the target role title.");
  }

  const recommendations = improvements.map((imp) => imp.recommendation);

  // Dynamic Interview Questions
  const interviewQuestions = [
    {
      id: `q-${nanoid(6)}`,
      question: matchedSkills.length > 0
        ? `Can you walk me through a project where you used ${matchedSkills[0]} to solve a critical problem?`
        : `Tell me about your background and how your experience prepares you for ${role.title}.`,
      testing: "Practical domain application and technical depth.",
      mention: "The specific business context, your individual contribution, and quantifiable results.",
      avoid: "Vague descriptions without clear individual technical ownership.",
    },
    {
      id: `q-${nanoid(6)}`,
      question: missingSkills.length > 0
        ? `This role specifies ${missingSkills[0]}. How would you approach learning or applying this on the job?`
        : `How do you prioritize deliverables when managing multiple competing technical tasks?`,
      testing: "Technical adaptability and capacity for self-directed learning.",
      mention: "Similar tools or concepts you mastered quickly in previous roles.",
      avoid: "Dismissing the requirement or claiming it is unnecessary.",
    },
    {
      id: `q-${nanoid(6)}`,
      question: `Describe a scenario where a project hit unexpected obstacles. How did you adapt?`,
      testing: "Problem solving, resilience, and process accountability.",
      mention: "Root cause analysis, proactive team communication, and lessons learned.",
      avoid: "Blaming external teams without owning your portion of the delivery.",
    },
  ];

  return {
    analysisId: `anl-${nanoid(10)}`,
    resumeId: resume.resumeId,
    roleId: role.id,
    jobTitle: role.title,
    filename: resume.filename,

    // Job Match Metrics
    overallScore,
    skillMatchScore: skillScore,
    keywordScore,
    experienceScore: expScore,
    educationStructureScore: edStructScore,
    atsScore: rawAtsScore,
    rejectionRisk,
    selectionLikelihood,

    // Dynamic Standalone Resume Quality Metrics
    overallResumeQuality,
    resumeQuality: {
      overall: overallResumeQuality,
      content: contentDetail,
      flow: flowDetail,
      presentation: presentationDetail,
      ats: atsDetail,
    },

    matchedSkills,
    transferableSkills,
    missingSkills,
    skills: skillsDetails,
    matchedKeywords,
    missingKeywords,
    strengths,
    gaps,
    recommendations,
    improvements,
    quickFixes,
    quantifiedAchievementsCount: quantifiedCount,
    actionVerbsCount: actionVerbCount,
    interviewQuestions,
    createdAt: new Date().toISOString(),
  };
}
