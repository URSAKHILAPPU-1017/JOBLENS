# JOBLENS

> **AI-Powered Resume & Job Matching Platform**
> A warm, intelligent career workspace that reads between the lines of your resume, compares it against any target role, and gives you a grounded, actionable path to your next opportunity.

---

## ⚡ Quick Start (If You Just Want to Run It)

If you are a student or developer who just wants to run JOBLENS locally right away:

```bash
# 1. Install dependencies
pnpm install

# 2. Run the development server
pnpm dev
```

Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

That's it! No external database setup, Docker, or API keys are required for default local execution.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [How JOBLENS Works](#-how-joblens-works)
- [Technology Stack](#-technology-stack)
- [System Requirements](#-system-requirements)
- [Installation Guide](#-installation-guide)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Job & Role Management](#-job--role-management)
- [Analysis & Matching Engine](#-analysis--matching-engine)
- [Exporting Reports](#-exporting-reports)
- [API Documentation](#-api-documentation)
- [Data Storage & Persistence](#-data-storage--persistence)
- [Testing & Quality Verification](#-testing--quality-verification)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Windows Setup](#-windows-setup)
- [VS Code & Antigravity Setup](#-vs-code--antigravity-setup)
- [License & Credits](#-license--credits)

---

## 🎯 Overview

**JOBLENS** treats resume review like an editorial craft: focused, evidence-led, and practical.

### What Problem It Solves
Most online job matching systems return generic, hard-coded percentages or require paid subscriptions without explaining *why* a candidate fits a role. Candidates submit resumes blindly without knowing which keywords are missing, how ATS scanners read their document, or how to structure behavioral interview responses.

### How JOBLENS Solves It
1. **Parses Real Files**: Reads uploaded **PDF**, **DOCX**, or **TXT** resumes and extracts readable text, skills, and section headers.
2. **Evaluates Against Any Role**: Compares extracted resume evidence against target job roles (built-in or custom user-created roles).
3. **Calculates Explainable Scores**: Computes a deterministic **Match Score**, **ATS Keyword Coverage**, **Experience Level**, and **Rejection Risk**.
4. **Generates Targeted Next Steps**: Identifies matched skills, transferable skills, missing requirements, tailored recommendations, and custom behavioral interview prep questions.

---

## ✨ Key Features

- 📄 **Multi-Format Resume Upload**: Upload `.pdf`, `.docx`, or `.txt` resumes (up to 10 MB).
- 🔍 **Real Text Extraction**: Server-side extraction using `PDFParse` (with scanned PDF detection) and `mammoth`.
- 💼 **Job Role Management (CRUD)**: Create, edit, search, select, and delete custom target job roles.
- 💾 **Role & Answer Persistence**: Automatically saves custom roles and interview answers to persistent server storage (`server/data/`).
- 📊 **Dynamic Match Engine**: Real non-fake scoring calculated dynamically from extracted resume text.
- 🎯 **ATS Keyword Analysis**: Evaluates presence of core industry skills, title terms, and section structures.
- 💡 **Tailored Recommendations**: Generates actionable advice based on specific missing job requirements.
- 🎤 **Interactive Interview Prep Workspace**: Draft, edit, and save responses to custom behavioral interview questions.
- 📥 **Multi-Format Report Export**: Download live analysis reports as **CSV**, multi-sheet **Excel (`.xlsx`)**, or print-ready **PDF**.
- 🔒 **100% Local & Private**: Runs completely on your machine. Resumes are processed locally and never stored externally.

---

## 🔄 How JOBLENS Works

```
Candidate Uploads Resume (.pdf / .docx / .txt)
                    │
                    ▼
Express Server Extracts Raw Text & Identifies Sections
                    │
                    ▼
Candidate Selects or Creates Target Job Role
                    │
                    ▼
Deterministic Matching Engine Evaluates Skills & Keywords
                    │
                    ▼
Calculates Overall Match %, ATS %, Strengths, & Missing Skills
                    │
                    ▼
Renders Live Dashboard, Interview Workspace, & Export Options
```

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4, Custom Editorial Lens CSS theme (`#f6f1e7` parchment cream canvas, `#16263b` ink navy, `#e7684a` coral accents)
- **UI Components & Icons**: Radix UI, Lucide React, Sonner (Toasts)
- **Charts & Motion**: Recharts, Framer Motion

### Backend
- **Server**: Node.js with Express 4
- **FileUpload**: Multer (Memory Buffer Storage)
- **PDF Extraction**: `pdf-parse` (v2.4.5)
- **DOCX Extraction**: `mammoth` (v1.12)
- **Data Persistence**: Atomic JSON File Storage (`server/data/roles.json`, `server/data/answers.json`)

### Testing & Utilities
- **Runner**: Vitest
- **Excel Export**: SheetJS (`xlsx`)
- **Process Manager**: Concurrently, ESBuild

---

## 📋 System Requirements

| Requirement | Supported Version |
| :--- | :--- |
| **Operating System** | Windows 10/11, macOS, or Linux |
| **Node.js** | **v18.0.0** or higher (Node 20+ recommended) |
| **Package Manager** | **pnpm v10.4.1+** (installed via `npm install -g pnpm`) |
| **Browser** | Chrome, Edge, Firefox, or Safari (Modern ES2022 support) |

---

## 📥 Installation Guide

Follow these step-by-step instructions to set up JOBLENS on your computer.

### Step 1 — Check Node.js
Open your terminal or command prompt and check if Node.js is installed:
```bash
node --version
```
> **Note**: If Node.js is not recognized, download and install the LTS version from [nodejs.org](https://nodejs.org/).

### Step 2 — Install pnpm
JOBLENS uses `pnpm` for fast, efficient package management:
```bash
npm install -g pnpm
```
Verify pnpm installation:
```bash
pnpm --version
```

### Step 3 — Clone or Download Project
If using Git:
```bash
git clone <repository-url>
cd _JOBLENS_
```
If using ZIP download, extract the file and open the root folder (`_JOBLENS_`) in your terminal.

### Step 4 — Install Dependencies
Run the install command inside the project directory:
```bash
pnpm install
```
This will install all required packages into `node_modules`.

---

## 🚀 Running the Application

### Development Mode
Runs both the Express API backend (port `3001`) and the Vite React frontend (port `3000`) with live hot-reloading:

```bash
pnpm dev
```

Once started, open **[http://localhost:3000](http://localhost:3000)** in your browser.
Vite automatically proxies `/api/*` requests to the Express server running on `http://localhost:3001`.

### Production Build & Execution
To build the optimized production bundle and start the unified Express server:

```bash
# 1. Build client bundle and server bundle
pnpm build

# 2. Start production server
pnpm start
```

The production application will be accessible at **[http://localhost:3000](http://localhost:3000)**.

---

## 📂 Project Structure

```
_JOBLENS_/
├── client/                     # Frontend Application Root
│   ├── index.html              # HTML Entry Point
│   ├── public/                 # Static Assets
│   │   └── assets/             # Local Vector SVG Graphics (joblens-mark, joblens-hero)
│   └── src/
│       ├── components/         # React Components
│       │   ├── AppDialog.tsx   # Help & Profile Modal
│       │   ├── InterviewModal.tsx # Interview Answer Workspace
│       │   ├── RoleModal.tsx   # Job Role Create/Edit Form
│       │   └── ui/             # Radix UI Primitives
│       ├── lib/                # Utility Functions
│       │   ├── exportUtils.ts  # CSV, Excel, PDF Export Logic
│       │   └── scoreColors.ts  # Semantic Score Color Interpolation
│       ├── pages/
│       │   ├── Home.tsx        # Main JOBLENS Canvas & Results Dashboard
│       │   └── NotFound.tsx    # 404 Fallback Page
│       ├── App.tsx             # Main App Shell & Wouter Routing
│       ├── index.css           # Editorial Lens Global Styling & Tokens
│       └── main.tsx            # React Root Mount
├── server/                     # Backend API & Processing
│   ├── data/                   # Persistent Data Storage
│   │   ├── roles.json          # Persistent User & Default Roles
│   │   └── answers.json        # Persistent Saved Interview Answers
│   ├── index.ts                # Express Server Endpoints & Static Server
│   ├── parser.ts               # PDF, DOCX, & TXT Text Parser
│   └── analysisEngine.test.ts  # Vitest Engine Test Suite
├── shared/                     # Shared Code Between Client & Server
│   ├── analysisEngine.ts       # Deterministic Matching & Scoring Algorithm
│   ├── defaultRoles.ts         # Pre-configured Industry Target Roles
│   └── types.ts                # TypeScript Interfaces & Models
├── package.json                # Project Manifest & Dependency Definitions
├── pnpm-lock.yaml              # Lockfile
├── vite.config.ts              # Vite Bundler & Dev Proxy Configuration
├── vitest.config.ts            # Vitest Test Runner Configuration
└── README.md                   # Documentation
```

---

## 💼 Job & Role Management

JOBLENS allows you to compare your resume against built-in roles or create custom roles tailored to specific job postings:

1. **Add New Role**: Click **"+ Add new role"** on the setup screen to open the Role Modal.
2. **Fill Role Details**: Enter Job Title, Company, Category, Description, Required Skills (comma-separated), Preferred Skills, Experience Level, and Location.
3. **Save & Persist**: Saving automatically selects the new role and persists it to `server/data/roles.json`.
4. **Edit & Delete**: Custom roles display **Edit** and **Delete** controls. Built-in default roles are protected from accidental deletion.

---

## 🧮 Analysis & Matching Engine

JOBLENS uses an explainable, deterministic scoring formula based strictly on the uploaded document text:

$$\text{Overall Score} = (\text{Skill Match} \times 45\%) + (\text{ATS Coverage} \times 20\%) + (\text{Experience} \times 20\%) + (\text{Structure} \times 15\%)$$

### Match Breakdown
- **Skill Match (45%)**: Evaluates required vs. preferred skill tokens. Supports aliases (e.g. `JS` $\leftrightarrow$ `JavaScript`, `React` $\leftrightarrow$ `React.js`, `ML` $\leftrightarrow$ `Machine Learning`).
- **ATS Keyword Coverage (20%)**: Checks presence of job title terms, technical terms, and domain action verbs.
- **Experience Match (20%)**: Detects employment timelines and longevity.
- **Education & Structure (15%)**: Verifies presence of standard section headings (`Experience`, `Education`, `Skills`).
- **Rejection Risk**: Calculated as $100 - \text{Overall Score}$.

### Different Resumes = Different Results
Because JOBLENS extracts text dynamically, uploading different resumes against the same role produces different, unique results:

- **Software Developer Resume** $\rightarrow$ Software Role: **85% Match** (High skill overlap in React, Node, SQL).
- **Software Developer Resume** $\rightarrow$ Hotel Manager Role: **35% Match** (Low overlap, missing Hospitality Management).
- **Data Scientist Resume** $\rightarrow$ Data Scientist Role: **87% Match** (Matched Python, Pandas, PyTorch).

---

## 📤 Exporting Reports

Once analysis is complete, click any of the export actions at the header or bottom of the results page:

- **CSV Export**: Downloads a structured `.csv` summary file containing scores, matched skills, gaps, and recommendations.
- **Excel Export (`.xlsx`)**: Generates a multi-sheet Workbook featuring an Overview sheet, Skill Breakdown sheet, and Recommendations sheet.
- **PDF Report**: Triggers a clean print dialog allowing you to save the complete report as a PDF via browser print options.

---

## 📑 API Documentation

The Express server exposes the following endpoints:

### `POST /api/resume/upload`
- **Purpose**: Uploads and extracts text from a resume document.
- **Request**: Multipart `formData` with field `resume` (`.pdf`, `.docx`, or `.txt`).
- **Response**: `{ success: true, resume: ParsedResume }`.

### `POST /api/analyze`
- **Purpose**: Runs matching algorithm on parsed resume against a target role.
- **Request Body**: `{ parsedResume: ParsedResume, role: JobRole }`.
- **Response**: `{ success: true, result: AnalysisResult }`.

### `GET /api/roles`
- **Purpose**: Fetches all available default and custom target roles.
- **Response**: `{ success: true, roles: JobRole[] }`.

### `POST /api/roles`
- **Purpose**: Creates a new custom target role.
- **Request Body**: `{ title, company, category, description, requiredSkills, preferredSkills, experienceLevel, location }`.
- **Response**: `{ success: true, role: JobRole }`.

### `PUT /api/roles/:id`
- **Purpose**: Updates an existing custom role.

### `DELETE /api/roles/:id`
- **Purpose**: Deletes a custom role (default system roles protected).

### `GET /api/answers/:analysisId` & `POST /api/answers`
- **Purpose**: Retrieves or saves interview workspace answers for a specific analysis session.

---

## 💾 Data Storage & Persistence

JOBLENS uses safe, local file storage:

- **Target Roles Storage**: Saved in `server/data/roles.json`.
- **Interview Answers**: Saved in `server/data/answers.json`.
- **Resetting Data**: To reset target roles back to defaults, delete `server/data/roles.json` and restart the server.

---

## 🧪 Testing & Quality Verification

Run the automated test suite to verify the analysis engine against diverse resume profiles:

```bash
# Run Vitest test suite
pnpm test

# Run TypeScript typecheck
pnpm check
```

Automated tests cover:
- Candidate A (Software) vs. Software Role (**Pass**)
- Candidate A (Software) vs. Hotel Manager Role (**Pass — Low match verified**)
- Candidate B (Data Science) vs. Data Scientist Role (**Pass**)
- Candidate C (VLSI / Hardware) vs. Hardware & Software Roles (**Pass — Dynamic gaps verified**)
- Candidate D (Hotel Ops) vs. Hotel Manager Role (**Pass**)

---

## 🔑 Environment Variables

No environment variables are required for default local execution!

### Optional Server Environment Variables
If you want to configure custom ports or server settings, create a `.env` file in the root directory:

```env
# Optional server port override (defaults to 3001 in dev, 3000 in prod)
PORT=3000

# Optional LLM integration (server-side only)
OPENAI_API_KEY=
GEMINI_API_KEY=
```

> ⚠️ **Security Note**: Never expose private API keys in client-side code or `VITE_*` variables. Private keys must remain server-side.

---

## 🔧 Troubleshooting

### `pnpm` is not recognized
Install `pnpm` globally using npm: `npm install -g pnpm`.

### Port 3000 or 3001 is already in use
Kill the process running on that port or specify a custom port in your terminal:
```bash
PORT=3005 pnpm dev
```

### PDF parsing says "Scanned or image-based"
If a PDF was created by scanning a physical paper document without OCR text layer, JOBLENS will notify you that text cannot be extracted. Convert the document to text or upload a standard text PDF / DOCX file.

### Blank or White Screen
Open your browser's Developer Tools (`F12`), check the **Console** tab for errors, and verify both Vite and Express terminals are running.

---

## 🖥 Windows Setup

If running on Windows PowerShell:

```powershell
# 1. Open PowerShell in project directory
# 2. Check Node & pnpm
node -v
pnpm -v

# 3. Install dependencies
pnpm install

# 4. Verify TypeScript compilation
pnpm check

# 5. Start dev server
pnpm dev
```

To stop the server, press `Ctrl + C` in your terminal window.

---

## 💻 VS Code & Antigravity Setup

1. Open **VS Code** or **Antigravity**.
2. Click **File $\rightarrow$ Open Folder** and select the root `_JOBLENS_` folder.
3. Open the built-in terminal (`Ctrl + ~` or `Cmd + ~`).
4. Run `pnpm install` then `pnpm dev`.
5. Click the `http://localhost:3000` link in the terminal output.

---

## 📄 License & Credits

- **License**: MIT License
- **Font Credits**: Fraunces (Google Fonts), DM Sans (Google Fonts)
- **Built with**: React, TypeScript, Vite, Express, Tailwind CSS, Radix UI, Lucide Icons, PDFParse, Mammoth, SheetJS, and Vitest.

---

*JOBLENS — See your resume. See your fit.*
