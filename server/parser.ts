import { nanoid } from "nanoid";
import { ParsedResume } from "../shared/types.js";

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\r\v\f]/g, "\n")
    .replace(/[^\x09\x0A\x20-\x7E\u00A0-\u024F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

function extractMetadata(text: string) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;
  const githubRegex = /(github\.com\/[a-zA-Z0-9_-]+)/i;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const linkedinMatch = text.match(linkedinRegex);
  const githubMatch = text.match(githubRegex);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let name = "";
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 2 && firstLine.length < 40 && !firstLine.includes("@")) {
      name = firstLine;
    }
  }

  return {
    name: name || undefined,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    linkedIn: linkedinMatch ? linkedinMatch[0] : undefined,
    github: githubMatch ? githubMatch[0] : undefined,
  };
}

function extractSections(text: string) {
  const lines = text.split("\n");
  const sections: {
    summary?: string;
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    certifications: string[];
  } = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  type SectionKey = "summary" | "skills" | "experience" | "education" | "projects" | "certifications" | null;
  let currentSection: SectionKey = null;

  const sectionHeaders: Record<string, SectionKey> = {
    "summary": "summary",
    "profile": "summary",
    "about me": "summary",
    "objective": "summary",
    "skills": "skills",
    "technical skills": "skills",
    "core competencies": "skills",
    "key skills": "skills",
    "technologies": "skills",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "work history": "experience",
    "education": "education",
    "academic background": "education",
    "qualification": "education",
    "qualifications": "education",
    "projects": "projects",
    "personal projects": "projects",
    "academic projects": "projects",
    "key projects": "projects",
    "certifications": "certifications",
    "certificates": "certifications",
    "licenses & certifications": "certifications",
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    if (sectionHeaders[lowerLine]) {
      currentSection = sectionHeaders[lowerLine];
      continue;
    }

    if (currentSection === "summary") {
      sections.summary = (sections.summary ? sections.summary + " " : "") + line;
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  return sections;
}

export async function parseResumeBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<ParsedResume> {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  let extractedText = "";
  let isScannedPdf = false;

  if (extension === "pdf" || mimetype === "application/pdf") {
    let pdfParser: any = null;
    try {
      const pdfModule = (await import("pdf-parse")) as any;
      const PDFParseClass = pdfModule.PDFParse || pdfModule;
      pdfParser = new PDFParseClass({ data: buffer });
      const textResult = await pdfParser.getText();
      extractedText = cleanText(textResult.text || "");
      if (extractedText.length < 40) {
        isScannedPdf = true;
      }
    } catch (err: any) {
      console.error("[PDF Parse Error]", err);
      throw new Error(`Failed to parse PDF file "${filename}". The file might be encrypted or corrupted.`);
    } finally {
      if (pdfParser && typeof pdfParser.destroy === "function") {
        await pdfParser.destroy().catch(() => {});
      }
    }
  } else if (
    extension === "docx" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = (await import("mammoth")) as any;
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = cleanText(docxResult.value || "");
    } catch (err: any) {
      console.error("[DOCX Parse Error]", err);
      throw new Error(`Failed to parse DOCX file "${filename}". The document might be corrupted.`);
    }
  } else if (extension === "txt" || mimetype === "text/plain" || mimetype.startsWith("text/")) {
    extractedText = cleanText(buffer.toString("utf-8"));
  } else {
    throw new Error(`Unsupported file type: .${extension}. Please upload a PDF, DOCX, or TXT resume.`);
  }

  if (!extractedText || extractedText.trim().length === 0) {
    if (isScannedPdf) {
      throw new Error("This PDF appears to be scanned or image-based and does not contain selectable text.");
    }
    throw new Error("The uploaded resume does not contain readable text. Please check the file.");
  }

  const metadata = extractMetadata(extractedText);
  const sections = extractSections(extractedText);

  return {
    resumeId: `res-${nanoid(10)}`,
    filename,
    fileType: extension,
    fileSize: buffer.length,
    extractedText,
    isScannedPdf,
    metadata,
    sections,
  };
}
