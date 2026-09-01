import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { nanoid } from "nanoid";
import { analyzeResume } from "../shared/analysisEngine";
import { DEFAULT_JOB_ROLES } from "../shared/defaultRoles";
import { JobRole, ParsedResume, SavedAnswer } from "../shared/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "data");
const ROLES_FILE = path.join(DATA_DIR, "roles.json");
const ANSWERS_FILE = path.join(DATA_DIR, "answers.json");

function ensureDataDir() {
  // Ignore filesystem writes in Vercel / serverless environment
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ROLES_FILE)) {
      fs.writeFileSync(ROLES_FILE, JSON.stringify(DEFAULT_JOB_ROLES, null, 2), "utf-8");
    }
    if (!fs.existsSync(ANSWERS_FILE)) {
      fs.writeFileSync(ANSWERS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (e) {
    // Read-only filesystem on Vercel functions — fail silently
  }
}

function loadRoles(): JobRole[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ROLES_FILE)) {
      const data = fs.readFileSync(ROLES_FILE, "utf-8");
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.warn("[loadRoles] Could not read roles.json, defaulting to built-in roles.");
  }
  return DEFAULT_JOB_ROLES;
}

function saveRoles(roles: JobRole[]) {
  ensureDataDir();
  if (process.env.VERCEL) return;
  const tmpFile = `${ROLES_FILE}.tmp-${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(roles, null, 2), "utf-8");
    fs.renameSync(tmpFile, ROLES_FILE);
  } catch (e) {
    console.warn("[saveRoles] Filesystem read-only or error saving roles.json. Client localStorage handles persistence.");
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

function loadAnswers(): SavedAnswer[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ANSWERS_FILE)) {
      const data = fs.readFileSync(ANSWERS_FILE, "utf-8");
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.warn("[loadAnswers] Could not read answers.json.");
  }
  return [];
}

function saveAnswers(answers: SavedAnswer[]) {
  ensureDataDir();
  if (process.env.VERCEL) return;
  const tmpFile = `${ANSWERS_FILE}.tmp-${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(answers, null, 2), "utf-8");
    fs.renameSync(tmpFile, ANSWERS_FILE);
  } catch (e) {
    console.warn("[saveAnswers] Filesystem read-only or error saving answers.json. Client localStorage handles persistence.");
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Multer configuration: Strict 4 MB file size limit
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB limit
  });

  const apiRouter = express.Router();

  // Health Check Endpoint (GET /health or GET /api/health)
  const healthHandler = (_req: Request, res: Response) => {
    return res.status(200).json({
      status: "ok",
      service: "JOBLENS API",
      timestamp: new Date().toISOString(),
    });
  };
  apiRouter.get(["/health", "/api/health"], healthHandler);

  // Resume Upload Endpoint (POST /resume/upload or POST /api/resume/upload)
  apiRouter.post(["/resume/upload", "/api/resume/upload"], (req: Request, res: Response, next: NextFunction) => {
    upload.single("resume")(req, res, async (err: any) => {
      if (err) {
        console.error("[Upload Middleware Error]", err);
        const isSizeLimit = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
        const status = isSizeLimit ? 413 : 400;
        return res.status(status).json({
          success: false,
          error: isSizeLimit
            ? "The uploaded file exceeds the 4 MB size limit. Please upload a resume under 4 MB."
            : err.message || "Failed to process file upload.",
          code: isSizeLimit ? "FILE_TOO_LARGE" : err.code || "UPLOAD_ERROR",
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: "Please select a PDF, DOCX, or TXT resume file to upload.",
            code: "NO_FILE",
          });
        }

        // Validate 4 MB file size limit strictly on server side
        if (req.file.size > 4 * 1024 * 1024) {
          return res.status(413).json({
            success: false,
            error: "The uploaded file exceeds the 4 MB size limit. Please upload a resume under 4 MB.",
            code: "FILE_TOO_LARGE",
          });
        }

        // Dynamically import parser to prevent top-level module load failures on Vercel initialization
        const { parseResumeBuffer } = await import("./parser");
        const parsed = await parseResumeBuffer(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        return res.status(200).json({
          success: true,
          resume: parsed,
        });
      } catch (parseErr: any) {
        console.error("[Resume Parser Exception]", parseErr);
        return res.status(422).json({
          success: false,
          error: parseErr.message || "Could not extract readable text from the document.",
          code: parseErr.code || "PARSE_ERROR",
        });
      }
    });
  });

  // Resume Analysis Endpoint (POST /analyze or POST /api/analyze)
  apiRouter.post(["/analyze", "/api/analyze"], (req: Request, res: Response) => {
    try {
      const { parsedResume, role } = req.body as { parsedResume: ParsedResume; role: JobRole };
      if (!parsedResume || !parsedResume.extractedText) {
        return res.status(400).json({
          success: false,
          error: "Missing uploaded resume content. Please upload your resume first.",
          code: "MISSING_RESUME",
        });
      }
      if (!role || !role.title) {
        return res.status(400).json({
          success: false,
          error: "Missing target job role. Please select or create a target job role.",
          code: "MISSING_ROLE",
        });
      }

      const result = analyzeResume(parsedResume, role);
      return res.status(200).json({ success: true, result });
    } catch (err: any) {
      console.error("[Analysis Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to generate analysis result.",
        code: "ANALYSIS_FAILED",
      });
    }
  });

  // Roles CRUD Endpoints
  apiRouter.get(["/roles", "/api/roles"], (_req: Request, res: Response) => {
    const roles = loadRoles();
    return res.status(200).json({ success: true, roles });
  });

  apiRouter.post(["/roles", "/api/roles"], (req: Request, res: Response) => {
    try {
      const { title, company, category, description, requiredSkills, preferredSkills, experienceLevel, location } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: "Job title is required.",
          code: "INVALID_TITLE",
        });
      }
      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: "Job description is required.",
          code: "INVALID_DESCRIPTION",
        });
      }

      const reqSkills = Array.isArray(requiredSkills)
        ? requiredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(requiredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

      const prefSkills = Array.isArray(preferredSkills)
        ? preferredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(preferredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

      const roles = loadRoles();
      const newRole: JobRole = {
        id: `role-${nanoid(8)}`,
        title: title.trim(),
        company: (company || "Custom Organization").trim(),
        category: (category || "General").trim(),
        description: description.trim(),
        requiredSkills: reqSkills.length > 0 ? reqSkills : ["General Skills"],
        preferredSkills: prefSkills,
        experienceLevel: (experienceLevel || "Mid Level").trim(),
        location: (location || "Flexible").trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
      };

      roles.unshift(newRole);
      saveRoles(roles);

      return res.status(200).json({ success: true, role: newRole });
    } catch (err: any) {
      console.error("[Create Role Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to create role.",
        code: "CREATE_ROLE_FAILED",
      });
    }
  });

  apiRouter.put(["/roles/:id", "/api/roles/:id"], (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, company, category, description, requiredSkills, preferredSkills, experienceLevel, location } = req.body;

      const roles = loadRoles();
      const index = roles.findIndex((r) => r.id === id);

      const reqSkills = Array.isArray(requiredSkills)
        ? requiredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(requiredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

      const prefSkills = Array.isArray(preferredSkills)
        ? preferredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(preferredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

      const existing = index >= 0 ? roles[index] : {
        id,
        title: title || "Custom Role",
        company: company || "Custom Organization",
        category: category || "General",
        description: description || "",
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        experienceLevel: experienceLevel || "Mid Level",
        location: location || "Remote",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
      };

      const updatedRole: JobRole = {
        ...existing,
        title: title ? title.trim() : existing.title,
        company: company ? company.trim() : existing.company,
        category: category ? category.trim() : existing.category,
        description: description ? description.trim() : existing.description,
        requiredSkills: reqSkills.length > 0 ? reqSkills : existing.requiredSkills,
        preferredSkills: prefSkills,
        experienceLevel: experienceLevel ? experienceLevel.trim() : existing.experienceLevel,
        location: location ? location.trim() : existing.location,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        roles[index] = updatedRole;
        saveRoles(roles);
      }

      return res.status(200).json({ success: true, role: updatedRole });
    } catch (err: any) {
      console.error("[Update Role Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to update role.",
        code: "UPDATE_ROLE_FAILED",
      });
    }
  });

  apiRouter.delete(["/roles/:id", "/api/roles/:id"], (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const roles = loadRoles();
      const target = roles.find((r) => r.id === id);

      if (target?.isDefault) {
        return res.status(400).json({
          success: false,
          error: "Default system roles cannot be deleted.",
          code: "PROTECTED_ROLE",
        });
      }

      const filtered = roles.filter((r) => r.id !== id);
      saveRoles(filtered);

      return res.status(200).json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error("[Delete Role Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to delete role.",
        code: "DELETE_ROLE_FAILED",
      });
    }
  });

  // Saved Interview Answers
  apiRouter.get(["/answers/:analysisId", "/api/answers/:analysisId"], (req: Request, res: Response) => {
    const { analysisId } = req.params;
    const all = loadAnswers();
    const filtered = all.filter((a) => a.analysisId === analysisId);
    return res.status(200).json({ success: true, answers: filtered });
  });

  apiRouter.post(["/answers", "/api/answers"], (req: Request, res: Response) => {
    try {
      const { analysisId, questionId, answer } = req.body;
      if (!analysisId || !questionId) {
        return res.status(400).json({
          success: false,
          error: "analysisId and questionId are required.",
          code: "INVALID_ANSWER_PAYLOAD",
        });
      }
      const all = loadAnswers();
      const existingIdx = all.findIndex((a) => a.analysisId === analysisId && a.questionId === questionId);

      const entry: SavedAnswer = {
        analysisId,
        questionId,
        answer: answer || "",
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        all[existingIdx] = entry;
      } else {
        all.push(entry);
      }

      saveAnswers(all);
      return res.status(200).json({ success: true, answer: entry });
    } catch (err: any) {
      console.error("[Save Answer Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to save interview answer.",
        code: "SAVE_ANSWER_FAILED",
      });
    }
  });

  // Mount API router on both /api and / to handle all Vercel serverless routing scenarios seamlessly
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  // Production Static Routing for Standalone Express Server
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    const staticPath = path.resolve(__dirname, "..");
    if (fs.existsSync(staticPath) && fs.existsSync(path.join(staticPath, "index.html"))) {
      app.use(express.static(staticPath));
      app.get("*", (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(staticPath, "index.html"));
      });
    }
  }

  // Centralized Express Error Handler (guarantees JSON response for all /api errors)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Central Error Handler]", err);
    const status = err.status || err.statusCode || (err instanceof multer.MulterError ? 400 : 500);
    return res.status(status).json({
      success: false,
      error: err.message || "An unexpected server error occurred.",
      code: err.code || "INTERNAL_SERVER_ERROR",
    });
  });

  return app;
}

export const app = createApp();
