import { describe, it, expect } from "vitest";
import { analyzeResume } from "../shared/analysisEngine";
import { ParsedResume, JobRole } from "../shared/types";
import { DEFAULT_JOB_ROLES } from "../shared/defaultRoles";

const softwareRole = DEFAULT_JOB_ROLES.find((r) => r.id === "role-software-dev")!;
const dataScienceRole = DEFAULT_JOB_ROLES.find((r) => r.id === "role-data-scientist")!;
const vlsiRole = DEFAULT_JOB_ROLES.find((r) => r.id === "role-vlsi-embedded")!;
const hotelRole = DEFAULT_JOB_ROLES.find((r) => r.id === "role-hotel-ops-manager")!;
const marketingRole = DEFAULT_JOB_ROLES.find((r) => r.id === "role-marketing-manager")!;

const softwareResume: ParsedResume = {
  resumeId: "res-sw",
  filename: "alex_dev.pdf",
  fileType: "pdf",
  fileSize: 2048,
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
    Skills: React, Node.js, TypeScript, SQL, JavaScript, Git, REST API
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
    skills: ["React", "Node.js", "TypeScript", "SQL", "JavaScript", "Git", "REST API"],
    experience: [
      "Developed a React dashboard that reduced manual reporting time by 30%.",
      "Built Node.js microservices serving 100,000 active users with 99.9% uptime.",
    ],
    education: ["B.S. in Computer Science - State University (2020)"],
    projects: [],
    certifications: [],
  },
};

const dataScienceResume: ParsedResume = {
  resumeId: "res-ds",
  filename: "data_scientist.pdf",
  fileType: "pdf",
  fileSize: 3000,
  extractedText: `
    Elena Scientist
    elena@analytics.org | 555-0288 | New York, NY | github.com/elenads
    Summary: Senior Data Scientist specializing in Machine Learning, Pandas, Python, and SQL data pipelines.
    Experience:
    Data Scientist - BigData Inc (2021 - Present)
    - Engineered predictive machine learning models using Scikit-Learn with 94% accuracy.
    - Processed 10TB of daily tabular data using Python, Pandas, NumPy, and SQL.
    - Reduced customer churn by 18% through automated propensity scoring.
    Education:
    M.S. in Statistics - Columbia University (2021)
    Skills: Python, Pandas, NumPy, SQL, Machine Learning, Scikit-Learn, Data Visualization, PyTorch
  `,
  metadata: {
    name: "Elena Scientist",
    email: "elena@analytics.org",
    phone: "555-0288",
    location: "New York, NY",
  },
  sections: {
    skills: ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "Scikit-Learn"],
    experience: [
      "Engineered predictive machine learning models with 94% accuracy.",
      "Processed 10TB of daily tabular data using Python, Pandas, NumPy, and SQL.",
    ],
    education: ["M.S. in Statistics - Columbia University (2021)"],
    projects: [],
    certifications: [],
  },
};

const vlsiResume: ParsedResume = {
  resumeId: "res-vlsi",
  filename: "embedded_eng.pdf",
  fileType: "pdf",
  fileSize: 1500,
  extractedText: `
    Marcus Micro
    marcus@hardware.net | 555-0377 | Austin, TX
    Summary: Embedded Systems and VLSI engineer experienced in C, C++, Verilog, FPGA, microcontrollers, and RTOS.
    Experience:
    Hardware Engineer - MicroChip Systems (2019 - Present)
    - Designed digital circuits and Verilog RTL for FPGA hardware acceleration cards.
    - Programmed STM32 microcontrollers in C and C++ for RTOS motor controllers.
    Education:
    B.S. in Electrical Engineering - UT Austin (2019)
    Skills: C, C++, Verilog, FPGA, Microcontrollers, RTOS, Embedded Systems, VHDL
  `,
  metadata: {
    name: "Marcus Micro",
    email: "marcus@hardware.net",
    phone: "555-0377",
  },
  sections: {
    skills: ["C", "C++", "Verilog", "FPGA", "Microcontrollers", "RTOS"],
    experience: ["Designed digital circuits and Verilog RTL for FPGA acceleration."],
    education: ["B.S. in Electrical Engineering (2019)"],
    projects: [],
    certifications: [],
  },
};

const hotelResume: ParsedResume = {
  resumeId: "res-hotel",
  filename: "hotel_manager.docx",
  fileType: "docx",
  fileSize: 2500,
  extractedText: `
    Sarah Hospitality
    sarah@grandstay.com | 555-0466 | Chicago, IL
    Summary: Accomplished Hotel Operations Manager with 7 years leading guest relations, staff scheduling, customer service, and budget allocation.
    Experience:
    General Manager - Grand Stay Hotel (2018 - Present)
    - Managed 45 hotel staff members across front desk, housekeeping, and guest services.
    - Improved guest satisfaction score from 82% to 96% over 24 months.
    - Oversaw annual operating budget of $3.5M with zero compliance audit findings.
    Education:
    B.A. in Hospitality Management - Cornell University (2017)
    Skills: Hospitality Management, Customer Service, Scheduling, Staff Leadership, Vendor Management, Budgeting
  `,
  metadata: {
    name: "Sarah Hospitality",
    email: "sarah@grandstay.com",
    phone: "555-0466",
  },
  sections: {
    skills: ["Hospitality Management", "Customer Service", "Scheduling", "Staff Leadership"],
    experience: ["Managed 45 hotel staff members.", "Improved guest satisfaction score."],
    education: ["B.A. in Hospitality Management (2017)"],
    projects: [],
    certifications: [],
  },
};

const marketingResume: ParsedResume = {
  resumeId: "res-marketing",
  filename: "marketing_lead.pdf",
  fileType: "pdf",
  fileSize: 1800,
  extractedText: `
    David Growth
    david@brandlabs.co | 555-0555 | Los Angeles, CA
    Summary: Dynamic Marketing Manager expert in Digital Marketing, SEO, Content Strategy, Google Analytics, and Social Media campaigns.
    Experience:
    Marketing Director - BrandLabs (2020 - Present)
    - Increased organic search traffic by 140% through targeted SEO and Content Strategy.
    - Managed $500k annual Google Ads and social media advertising spend with 4.2x ROAS.
    Education:
    B.A. in Communications - UCLA (2019)
    Skills: Digital Marketing, SEO, Content Strategy, Google Analytics, Social Media, Campaign Management, Copywriting
  `,
  metadata: {
    name: "David Growth",
    email: "david@brandlabs.co",
    phone: "555-0555",
  },
  sections: {
    skills: ["Digital Marketing", "SEO", "Content Strategy", "Google Analytics"],
    experience: ["Increased organic search traffic by 140%."],
    education: ["B.A. in Communications (2019)"],
    projects: [],
    certifications: [],
  },
};

describe("Analysis Engine — 5 Domain Verification & Dynamic Scoring", () => {
  it("computes strong high scores when matching candidates against their domain role", () => {
    const swResult = analyzeResume(softwareResume, softwareRole);
    const dsResult = analyzeResume(dataScienceResume, dataScienceRole);
    const vlsiResult = analyzeResume(vlsiResume, vlsiRole);
    const hotelResult = analyzeResume(hotelResume, hotelRole);
    const mktResult = analyzeResume(marketingResume, marketingRole);

    expect(swResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(dsResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(vlsiResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(hotelResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(mktResult.overallScore).toBeGreaterThanOrEqual(75);
  });

  it("produces significantly different scores when testing cross-domain candidate against a role", () => {
    const swAgainstSoftware = analyzeResume(softwareResume, softwareRole);
    const swAgainstHotel = analyzeResume(softwareResume, hotelRole);
    const swAgainstMarketing = analyzeResume(softwareResume, marketingRole);

    expect(swAgainstSoftware.overallScore).toBeGreaterThan(swAgainstHotel.overallScore);
    expect(swAgainstSoftware.overallScore).toBeGreaterThan(swAgainstMarketing.overallScore);

    expect(swAgainstHotel.missingSkills).toContain("Hospitality Management");
    expect(swAgainstHotel.missingSkills).toContain("Customer Service");
    expect(swAgainstMarketing.missingSkills).toContain("SEO");
  });

  it("dynamically generates targeted improvements for missing skills and metrics", () => {
    const hotelAgainstSoftware = analyzeResume(hotelResume, softwareRole);
    expect(hotelAgainstSoftware.improvements.length).toBeGreaterThan(0);
    const skillImp = hotelAgainstSoftware.improvements.find((i) => i.category === "ats");
    expect(skillImp).toBeDefined();
    expect(skillImp?.explanation).toContain("Software Developer");
  });

  it("ensures all scores remain between 0 and 100 with valid numbers", () => {
    [softwareResume, dataScienceResume, vlsiResume, hotelResume, marketingResume].forEach((resume) => {
      const res = analyzeResume(resume, softwareRole);
      expect(res.overallScore).toBeGreaterThanOrEqual(0);
      expect(res.overallScore).toBeLessThanOrEqual(100);
      expect(res.overallResumeQuality).toBeGreaterThanOrEqual(0);
      expect(res.overallResumeQuality).toBeLessThanOrEqual(100);
      expect(Number.isNaN(res.overallScore)).toBe(false);
      expect(Number.isNaN(res.overallResumeQuality)).toBe(false);
    });
  });
});
