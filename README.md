# JOBLENS — Production & Vercel-Compatible Resume Intelligence Platform

> **AI-Powered Resume & Job Matching Platform**  
> An evidence-led career workspace that analyzes uploaded resumes against target job roles, computes dynamic ATS and match scores, and provides tailored recommendations and interview preparation.

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Run TypeScript type check
pnpm check

# 3. Run automated tests
pnpm test

# 4. Start local development server
pnpm dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.  
Vite automatically proxies `/api/*` requests to the Express backend running on **`http://localhost:3001`**.

---

## 📖 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Vercel Deployment Architecture](#-vercel-deployment-architecture)
- [Key Features](#-key-features)
- [System Requirements](#-system-requirements)
- [Upload File Limits & Formats](#-upload-file-limits--formats)
- [Storage Architecture (Local vs. Vercel)](#-storage-architecture-local-vs-vercel)
- [API Documentation](#-api-documentation)
- [Building & Testing](#-building--testing)
- [Deploying to Vercel](#-deploying-to-vercel)
- [Environment Variables](#-environment-variables)
- [Troubleshooting & Limitations](#-troubleshooting--limitations)

---

## 🏗️ Architecture Overview

JOBLENS separates frontend user interface from backend API processing while maintaining single-command execution in local development:

```
[ Frontend: React + Vite + TypeScript ] (Port 3000)
                    │
                    │ Relative HTTP Requests (/api/*)
                    ▼
[ Backend: Express App (server/app.ts) ] (Port 3001)
        ├── /api/health
        ├── /api/resume/upload  (Multer + PDFParse + Mammoth, max 4 MB)
        ├── /api/analyze        (Dynamic Analysis Engine)
        ├── /api/roles          (Default + Custom Roles)
        └── /api/answers        (Interview Answer Workspace)
```

---

## 🚀 Vercel Deployment Architecture

To achieve zero-downtime deployment on Vercel Serverless Functions without altering local development:

1. **Modular Express Application (`server/app.ts`)**: Contains all middleware, route definitions, 4 MB payload upload handling, and centralized JSON error handlers.
2. **Local HTTP Server (`server/index.ts`)**: Imports `app` from `./app.ts` and listens on `http://localhost:3001` when running `pnpm dev`.
3. **Vercel Functions Entrypoint (`api/index.ts`)**: Exposes the Express `app` as a Vercel Serverless Function handling all `/api/*` endpoints.
4. **Vercel Routing (`vercel.json`)**: Configures static SPA routing to `dist` and routes `/api/*` endpoints directly to Vercel Functions.

---

## ✨ Key Features

- 📄 **Multi-Format Resume Upload**: Upload `.pdf`, `.docx`, or `.txt` resumes (up to **4 MB**).
- 🔍 **Real Text Extraction**: Server-side extraction using `PDFParse` (with scanned PDF detection) and `mammoth`.
- 💼 **Job Role Management (CRUD)**: Create, edit, search, select, and delete custom target job roles.
- 💾 **Stateless & Resilient Storage**: Browser `localStorage` persistence for custom roles and interview answers, combined with default system roles (`shared/defaultRoles.ts`).
- 📊 **Dynamic Match Engine**: Real non-fake scoring calculated dynamically from extracted resume text against target role criteria.
- 🎯 **ATS Keyword Analysis**: Evaluates presence of core industry skills, title terms, action verbs, and section structures.
- 💡 **Tailored Recommendations**: Generates actionable advice based on specific missing job requirements.
- 🎤 **Interactive Interview Prep Workspace**: Draft, edit, and save responses to custom behavioral interview questions.
- 📥 **Multi-Format Report Export**: Download live analysis reports as **CSV**, multi-sheet **Excel (`.xlsx`)**, or print-ready **PDF**.

---

## 📦 System Requirements

- **Node.js**: `v18.0.0` or higher (v20+ recommended)
- **Package Manager**: `pnpm` (v10+ recommended)

---

## 📁 Upload File Limits & Formats

- **Supported Formats**: `.pdf`, `.docx`, `.txt`
- **Maximum File Size**: **4 MB** (enforced on both client-side and server-side)
- **Vercel Payload Limit**: Vercel Serverless Functions enforce a 4.5 MB request body limit. The 4 MB application limit ensures safe, reliable uploads without triggering 413 HTTP errors on Vercel.

*Note: For applications requiring uploads over 4 MB, direct-to-storage services (such as Vercel Blob or S3 presigned URLs) would be required.*

---

## 💾 Storage Architecture (Local vs. Vercel)

### Local Storage vs. Production Storage

| Environment | Default Roles | Custom Roles Persistence | Interview Answers Persistence | Server Filesystem Writes |
| :--- | :--- | :--- | :--- | :--- |
| **Local (`pnpm dev`)** | `shared/defaultRoles.ts` | Browser `localStorage` + `server/data/roles.json` | Browser `localStorage` + `server/data/answers.json` | Supported |
| **Vercel Production** | `shared/defaultRoles.ts` | Browser `localStorage` (`joblens_custom_roles`) | Browser `localStorage` (`joblens_interview_answers`) | Read-only (safe fallback) |

> [!IMPORTANT]
> **Vercel Serverless Functions run on an ephemeral, read-only filesystem.** Server-side filesystem writes to `server/data/*.json` do NOT persist across serverless function invocations.  
> JOBLENS uses browser `localStorage` to ensure custom roles and interview prep answers survive page refreshes and browser sessions seamlessly.

---

## 📡 API Documentation

All API endpoints return valid JSON and include centralized HTTP error responses.

| Method | Endpoint | Description | Payload / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint | N/A |
| `POST` | `/api/resume/upload` | Upload & parse resume | `multipart/form-data` with `resume` file (max 4 MB) |
| `POST` | `/api/analyze` | Perform resume analysis | `{ parsedResume, role }` |
| `GET` | `/api/roles` | Retrieve available job roles | N/A |
| `POST` | `/api/roles` | Create a new custom role | `{ title, description, requiredSkills, ... }` |
| `PUT` | `/api/roles/:id` | Update an existing role | `{ title, description, requiredSkills, ... }` |
| `DELETE` | `/api/roles/:id` | Delete a custom role | N/A |
| `GET` | `/api/answers/:analysisId` | Get interview answers for analysis | N/A |
| `POST` | `/api/answers` | Save an interview answer | `{ analysisId, questionId, answer }` |

---

## 🧪 Building & Testing

```bash
# 1. Type Check (TypeScript)
pnpm check

# 2. Run Vitest Unit Tests
pnpm test

# 3. Build Production Bundle
pnpm build
```

The build process outputs:
- **Frontend SPA**: `dist/` (`index.html` + asset chunks)
- **Local Server Bundle**: `dist/server/index.js`

---

## 🌐 Deploying to Vercel

1. Push your code to GitHub / GitLab.
2. Import the repository in your [Vercel Dashboard](https://vercel.com).
3. Vercel will automatically detect:
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Serverless Function**: `api/index.ts`
4. Click **Deploy**.

---

## 🔑 Environment Variables

See `.env.example`:

```env
PORT=3001
NODE_ENV=development
```

---

## ❓ Troubleshooting & Limitations

- **Scanned / Image-based PDFs**: Scanned PDFs without embedded text layers cannot be text-extracted. The platform returns a user-friendly prompt requesting a text-based document.
- **Upload File Size Error**: Files over 4 MB are blocked before transmission. Ensure resumes are compressed or saved in standard vector PDF/DOCX format.
- **Local Port Conflicts**: If port 3000 or 3001 is in use, set `PORT=3002` in your environment or kill the conflicting process.

---

## 📄 License

MIT License. Built for seamless local execution and production deployment on Vercel.
