export interface JobRole {
  id: string;
  title: string;
  company: string;
  category: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface ParsedResume {
  resumeId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  isScannedPdf?: boolean;
  metadata: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
  };
  sections: {
    summary?: string;
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    certifications: string[];
  };
}

export interface SkillMatchDetail {
  name: string;
  state: "Matched" | "Transferable" | "Not identified";
  detail: string;
}

export interface ResumeImprovement {
  id: string;
  priority: "high" | "medium" | "low";
  category: "content" | "structure" | "ats" | "presentation";
  title: string;
  explanation: string;
  evidence: string;
  recommendation: string;
}

export interface SubCategoryMetric {
  name: string;
  score: number;
  explanation: string;
}

export interface CategoryScoreDetail {
  score: number;
  summary: string;
  metrics: SubCategoryMetric[];
}

export interface AnalysisResult {
  analysisId: string;
  resumeId: string;
  roleId: string;
  jobTitle: string;
  filename: string;
  
  // Job Match / Hiring Readiness (Job-dependent)
  overallScore: number;
  skillMatchScore: number;
  keywordScore: number;
  experienceScore: number;
  educationStructureScore: number;
  atsScore: number;
  rejectionRisk: number;
  selectionLikelihood: "High" | "Moderate" | "Low";
  
  // Standalone Resume Quality (Resume-focused)
  overallResumeQuality: number;
  resumeQuality: {
    overall: number;
    content: CategoryScoreDetail;
    flow: CategoryScoreDetail;
    presentation: CategoryScoreDetail;
    ats: CategoryScoreDetail;
  };

  matchedSkills: string[];
  transferableSkills: string[];
  missingSkills: string[];
  skills: SkillMatchDetail[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  improvements: ResumeImprovement[];
  quickFixes: string[];
  quantifiedAchievementsCount: number;
  actionVerbsCount: number;

  interviewQuestions: Array<{
    id: string;
    question: string;
    testing: string;
    mention: string;
    avoid: string;
  }>;
  createdAt: string;
}

export interface SavedAnswer {
  analysisId: string;
  questionId: string;
  answer: string;
  updatedAt: string;
}
