import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { nanoid } from "nanoid";
import { parseResumeBuffer } from "./parser";
import { analyzeResume } from "../shared/analysisEngine";
import { DEFAULT_JOB_ROLES } from "../shared/defaultRoles";
import { JobRole, ParsedResume, SavedAnswer } from "../shared/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "data");
const ROLES_FILE = path.join(DATA_DIR, "roles.json");
const ANSWERS_FILE = path.join(DATA_DIR, "answers.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ROLES_FILE)) {
    try {
      fs.writeFileSync(ROLES_FILE, JSON.stringify(DEFAULT_JOB_ROLES, null, 2), "utf-8");
    } catch (e) {
      console.error("[ensureDataDir] Failed to initialize roles.json", e);
    }
  }
  if (!fs.existsSync(ANSWERS_FILE)) {
    try {
      fs.writeFileSync(ANSWERS_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch (e) {
      console.error("[ensureDataDir] Failed to initialize answers.json", e);
    }
  }
}

function loadRoles(): JobRole[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(ROLES_FILE, "utf-8");
    if (!data || !data.trim()) return DEFAULT_JOB_ROLES;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_JOB_ROLES;
  } catch (e) {
    console.error("[loadRoles] Error parsing roles.json. Recovering with default roles.", e);
    try {
      fs.writeFileSync(ROLES_FILE, JSON.stringify(DEFAULT_JOB_ROLES, null, 2), "utf-8");
    } catch {}
    return DEFAULT_JOB_ROLES;
  }
}

function saveRoles(roles: JobRole[]) {
  ensureDataDir();
  const tmpFile = `${ROLES_FILE}.tmp-${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(roles, null, 2), "utf-8");
    fs.renameSync(tmpFile, ROLES_FILE);
  } catch (e) {
    console.error("[saveRoles] Error saving roles.json", e);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

function loadAnswers(): SavedAnswer[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(ANSWERS_FILE, "utf-8");
    if (!data || !data.trim()) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[loadAnswers] Error parsing answers.json. Recovering with empty array.", e);
    try {
      fs.writeFileSync(ANSWERS_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch {}
    return [];
  }
}

function saveAnswers(answers: SavedAnswer[]) {
  ensureDataDir();
  const tmpFile = `${ANSWERS_FILE}.tmp-${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(answers, null, 2), "utf-8");
    fs.renameSync(tmpFile, ANSWERS_FILE);
  } catch (e) {
    console.error("[saveAnswers] Error saving answers.json", e);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

async function startServer() {
  ensureDataDir();
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  });

  // =========================================================================
  // API ENDPOINTS
  // =========================================================================

  // Health Check Endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    return res.status(200).json({
      status: "ok",
      service: "JOBLENS",
      timestamp: new Date().toISOString(),
    });
  });

  // Resume Upload Endpoint
  app.post("/api/resume/upload", (req: Request, res: Response, next: NextFunction) => {
    upload.single("resume")(req, res, async (err: any) => {
      if (err) {
        console.error("[Upload Middleware Error]", err);
        const isSizeLimit = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
        const status = isSizeLimit ? 413 : 400;
        return res.status(status).json({
          success: false,
          error: isSizeLimit
            ? "The uploaded file is too large. Please upload a resume under 10 MB."
            : err.message || "Failed to process file upload.",
          code: err.code || "UPLOAD_ERROR",
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

  // Resume Analysis Endpoint
  app.post("/api/analyze", (req: Request, res: Response) => {
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
  app.get("/api/roles", (_req: Request, res: Response) => {
    const roles = loadRoles();
    return res.status(200).json({ success: true, roles });
  });

  app.post("/api/roles", (req: Request, res: Response) => {
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

  app.put("/api/roles/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, company, category, description, requiredSkills, preferredSkills, experienceLevel, location } = req.body;

      const roles = loadRoles();
      const index = roles.findIndex((r) => r.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: "Role not found.",
          code: "ROLE_NOT_FOUND",
        });
      }

      const existing = roles[index];
      const reqSkills = Array.isArray(requiredSkills)
        ? requiredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(requiredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

      const prefSkills = Array.isArray(preferredSkills)
        ? preferredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : String(preferredSkills || "").split(",").map((s) => s.trim()).filter(Boolean);

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

      roles[index] = updatedRole;
      saveRoles(roles);

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

  app.delete("/api/roles/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const roles = loadRoles();
      const target = roles.find((r) => r.id === id);

      if (!target) {
        return res.status(404).json({
          success: false,
          error: "Role not found.",
          code: "ROLE_NOT_FOUND",
        });
      }

      if (target.isDefault) {
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
  app.get("/api/answers/:analysisId", (req: Request, res: Response) => {
    const { analysisId } = req.params;
    const all = loadAnswers();
    const filtered = all.filter((a) => a.analysisId === analysisId);
    return res.status(200).json({ success: true, answers: filtered });
  });

  app.post("/api/answers", (req: Request, res: Response) => {
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

  // =========================================================================
  // PRODUCTION vs DEV STATIC ROUTING
  // =========================================================================
  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  // =========================================================================
  // CENTRALIZED EXPRESS ERROR HANDLER (Guarantees JSON responses for all /api)
  // =========================================================================
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Express Central Error Handler]", err);
    const status = err.status || err.statusCode || (err instanceof multer.MulterError ? 400 : 500);
    return res.status(status).json({
      success: false,
      error: err.message || "An unexpected server error occurred.",
      code: err.code || "INTERNAL_SERVER_ERROR",
    });
  });

  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);

  server.listen(port, () => {
    console.log(`[JOBLENS API Server] Running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
