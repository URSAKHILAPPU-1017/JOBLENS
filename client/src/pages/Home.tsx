// JOBLENS: Editorial Lens career workspace, evidence-led intelligence, fully functional locally.
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
  FileCheck,
} from "lucide-react";
import { getScoreColor, getRiskColor, isPerfectScore } from "@/lib/scoreColors";
import { AnalysisResult, JobRole, ParsedResume, ResumeImprovement } from "@shared/types";
import { DEFAULT_JOB_ROLES } from "@shared/defaultRoles";
import { RoleModal } from "@/components/RoleModal";
import { InterviewModal } from "@/components/InterviewModal";
import { AppDialog } from "@/components/AppDialog";
import { exportCSV, exportExcel, exportPDFPrint } from "@/lib/exportUtils";
import { apiFetch, ApiError } from "@/lib/api";
import { OfflinePage } from "@/components/OfflinePage";
import { ServerErrorPage } from "@/components/ServerErrorPage";

type Stage = { label: string; detail: string };
const stages: Stage[] = [
  { label: "Reading resume", detail: "Extracting raw text from document structure." },
  { label: "Parsing sections", detail: "Organizing experience, education, and credentials." },
  { label: "Identifying skills", detail: "Connecting explicit and transferable technology signals." },
  { label: "Comparing job requirements", detail: "Measuring overlap against selected role specifications." },
  { label: "Checking ATS compatibility", detail: "Reviewing section headers and keyword density." },
  { label: "Preparing recommendations", detail: "Generating tailored next steps and interview prep." },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-full border-2 border-[#e7684a] bg-[#16263b] shadow-[4px_4px_0_#e7684a]">
        <img
          src="/assets/joblens-mark.svg"
          alt="JOBLENS"
          className="h-6 w-6 object-contain"
        />
      </div>
      {!compact && (
        <span className="font-display text-[1.5rem] font-semibold tracking-[-.04em] text-[#fffaf2]">
          JOBLENS
        </span>
      )}
    </div>
  );
}

function Score({ value, label }: { value: number; label: string }) {
  const color = getScoreColor(value);
  return (
    <div className="flex items-center gap-3">
      <div className={`relative h-16 w-16 shrink-0 ${isPerfectScore(value) ? "animate-pulse-soft" : ""}`}>
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#e8dfd0" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${value * 1.13} 113`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div>
        <div className="eyebrow text-[#7d8791]">{label}</div>
        <div className="mt-1 text-sm font-semibold" style={{ color }}>
          {value >= 85 ? "Strong signal" : value >= 60 ? "Developing signal" : "Needs attention"}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<"home" | "setup" | "analysis" | "results">("home");
  const [roles, setRoles] = useState<JobRole[]>(DEFAULT_JOB_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(DEFAULT_JOB_ROLES[0].id);
  const [query, setQuery] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [stage, setStage] = useState(-1);
  const [activeResultTab, setActiveResultTab] = useState("Overview");

  // Error States for Full Page Fallbacks
  const [pageError, setPageError] = useState<"OFFLINE" | "SERVER_UNAVAILABLE" | null>(null);

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<JobRole | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load roles on mount
  const loadRoles = async () => {
    try {
      const data = await apiFetch("/api/roles", { timeoutMs: 5000 });
      if (data.roles && Array.isArray(data.roles) && data.roles.length > 0) {
        setRoles(data.roles);
        if (!data.roles.some((r: JobRole) => r.id === selectedRoleId)) {
          setSelectedRoleId(data.roles[0].id);
        }
      }
      setPageError(null);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "SERVER_UNAVAILABLE") {
          setPageError("SERVER_UNAVAILABLE");
        } else if (err.code === "OFFLINE") {
          setPageError("OFFLINE");
        }
      }
      setRoles(DEFAULT_JOB_ROLES);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || DEFAULT_JOB_ROLES[0];
  }, [roles, selectedRoleId]);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      `${r.title} ${r.company} ${r.category} ${(r.requiredSkills || []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [roles, query]);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsedResume(null);
    setAnalysisResult(null); // Clear previous analysis session!
    setIsUploading(true);

    const formData = new FormData();
    formData.append("resume", uploadedFile);

    try {
      const data = await apiFetch("/api/resume/upload", {
        method: "POST",
        body: formData,
        timeoutMs: 30000, // 30s timeout for large uploads
      });

      setParsedResume(data.resume);
      toast.success("Resume processed successfully!", {
        description: `Extracted ${data.resume.extractedText.length} characters of readable text.`,
      });
    } catch (err: any) {
      setFile(null);
      setParsedResume(null);
      const userMsg = err.userMessage || err.message || "Could not read resume file.";
      toast.error(userMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const begin = () => {
    setView("setup");
    setTimeout(() => document.getElementById("setup")?.scrollIntoView({ behavior: "smooth" }), 40);
  };

  const analyze = async () => {
    if (!file) {
      toast.error("Please add a PDF, DOCX, or TXT resume first.");
      return;
    }
    if (!parsedResume) {
      toast.error("Resume is still processing. Please wait a moment.");
      return;
    }

    setView("analysis");
    setStage(0);

    // Staged visualization representing real analysis execution
    for (let i = 0; i < stages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStage(i);
    }

    try {
      const data = await apiFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedResume,
          role: selectedRole,
        }),
        timeoutMs: 15000,
      });

      setAnalysisResult(data.result);
      setStage(stages.length);
      setView("results");
    } catch (err: any) {
      setView("setup");
      const userMsg = err.userMessage || err.message || "Failed to generate analysis result.";
      toast.error(userMsg);
    }
  };

  const handleDeleteRole = async (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = roles.find((r) => r.id === roleId);
    if (target?.isDefault) {
      toast.error("Default system roles cannot be deleted.");
      return;
    }

    try {
      await apiFetch(`/api/roles/${roleId}`, { method: "DELETE" });

      toast.success("Role deleted.");
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      if (selectedRoleId === roleId) {
        const remaining = roles.filter((r) => r.id !== roleId);
        if (remaining.length > 0) setSelectedRoleId(remaining[0].id);
      }
    } catch (err: any) {
      toast.error(err.userMessage || err.message || "Failed to delete role.");
    }
  };

  const handleOpenEditRole = (role: JobRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoleToEdit(role);
    setRoleModalOpen(true);
  };

  const handleOpenAddRole = () => {
    setRoleToEdit(null);
    setRoleModalOpen(true);
  };

  const handleSaveRoleCallback = (savedRole: JobRole) => {
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === savedRole.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRole.id ? savedRole : r));
      }
      return [savedRole, ...prev];
    });
    setSelectedRoleId(savedRole.id);
    if (analysisResult) {
      toast.info("Target role updated. Run 'Analyze with JOBLENS' to re-evaluate against this role.");
    }
  };

  const resetAnalysis = () => {
    setView("setup");
    setFile(null);
    setParsedResume(null);
    setAnalysisResult(null);
    setStage(-1);
  };

  // FULL PAGE ERROR FALLBACKS
  if (pageError === "OFFLINE") {
    return <OfflinePage onRetry={loadRoles} />;
  }

  if (pageError === "SERVER_UNAVAILABLE") {
    return <ServerErrorPage onRetry={loadRoles} />;
  }

  // ANALYSIS STAGE LOADER VIEW
  if (view === "analysis") {
    return (
      <div className="min-h-screen bg-[#16263b] px-6 py-10 text-[#fffaf2]">
        <div className="mx-auto max-w-3xl">
          <Logo />
          <div className="mt-24 grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div>
              <div className="eyebrow text-[#e7684a]">JOBLENS AI ANALYSIS</div>
              <h1 className="font-display mt-4 text-5xl leading-[.95] tracking-[-.05em] md:text-7xl">
                Finding the signal.
              </h1>
              <p className="mt-6 max-w-sm text-[#c2cbd3]">
                Analyzing <span className="text-white font-semibold">{file?.name || "your resume"}</span> against{" "}
                <span className="text-[#e7684a] font-semibold">{selectedRole.title}</span>.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-6 backdrop-blur">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-sm font-semibold">{file?.name || "Resume.pdf"}</span>
                <span className="text-xs text-[#aab5bf]">
                  {Math.min(100, Math.round(((stage + 1) / stages.length) * 100))}%
                </span>
              </div>
              {stages.map((item, index) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-3 border-b border-white/10 py-4 transition-opacity duration-300 ${
                    index > stage ? "opacity-35" : "opacity-100"
                  }`}
                >
                  {index < stage ? (
                    <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#668f7b] text-[#16263b]">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="mt-0.5 h-5 w-5 rounded-full border border-white/25">
                      {index === stage && (
                        <div className="m-1.5 h-2 w-2 animate-pulse-soft rounded-full bg-[#e7684a]" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs text-[#aab5bf]">
                      {index === stage ? item.detail : index < stage ? "Complete" : "Queued"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  if (view === "results" && analysisResult) {
    return (
      <ResultsView
        result={analysisResult}
        role={selectedRole}
        activeTab={activeResultTab}
        setActiveTab={setActiveResultTab}
        reset={resetAnalysis}
        onOpenQuestion={(q) => {
          setSelectedQuestion(q);
          setInterviewModalOpen(true);
        }}
      />
    );
  }

  // MAIN WORKSPACE VIEW
  return (
    <div className="app-shell flex min-h-screen bg-[#f6f1e7] text-[#16263b]">
      {/* SIDE RAIL */}
      <aside className="side-rail sticky top-0 flex min-h-screen w-[276px] shrink-0 flex-col justify-between bg-[#16263b] p-7 text-[#fffaf2]">
        <div>
          <Logo />
          <div className="mt-16">
            <div className="eyebrow text-[#8190a0]">Your career lens</div>
            <p className="mt-3 max-w-[170px] text-sm leading-6 text-[#bdc7d0]">
              A clearer read on where your resume meets opportunity.
            </p>
          </div>
          <nav className="mt-14 space-y-2">
            <button
              onClick={() => setView("home")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                view === "home" ? "bg-white/10 text-white" : "text-[#bdc7d0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <LayoutDashboard size={17} /> Overview
            </button>
            <button
              onClick={begin}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                view === "setup" ? "bg-white/10 text-white font-semibold" : "text-[#bdc7d0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Target size={17} /> Analyze resume
            </button>
            <button
              onClick={() => {
                if (analysisResult) {
                  setActiveResultTab("Interview prep");
                  setView("results");
                } else {
                  toast.info("Upload and analyze a resume to unlock tailored interview prep.");
                  begin();
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#bdc7d0] transition hover:bg-white/10 hover:text-white"
            >
              <Sparkles size={17} /> Interview prep
            </button>
          </nav>
        </div>
        <div className="border-t border-white/10 pt-5 text-xs leading-5 text-[#8e9ba8]">
          <ShieldCheck size={16} className="mb-2 text-[#e7684a]" />
          Your resume stays yours. JOBLENS processes files locally and never stores private information externally.
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-6 py-6 md:px-12">
          <div className="flex items-center gap-3 md:hidden">
            <Logo compact />
          </div>
          <div className="hidden text-sm text-[#657180] md:block">
            Career clarity, in focus.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHelpDialogOpen(true)}
              aria-label="Help"
              className="rounded-full p-2 text-[#657180] hover:bg-[#e9e2d5]"
            >
              <CircleHelp size={18} />
            </button>
            <button
              onClick={() => setProfileDialogOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7684a] text-sm font-bold text-white shadow-[2px_2px_0_#16263b]"
            >
              JL
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-[1240px] px-6 pb-24 md:px-12">
          {/* HERO SECTION */}
          <div className="hero-grid grid items-center gap-12 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:pt-16">
            <div className="animate-rise">
              <div className="eyebrow text-[#e7684a]">AI-POWERED RESUME INTELLIGENCE</div>
              <h1 className="font-display mt-5 max-w-xl text-[clamp(3.5rem,7vw,6.8rem)] leading-[.88] tracking-[-.07em]">
                See your resume.<br />
                <em className="text-[#e7684a]">See your fit.</em>
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-8 text-[#657180]">
                JOBLENS reads between the lines of your resume, compares it to any target role, and gives you a grounded path to your next opportunity.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button
                  onClick={begin}
                  className="h-12 rounded-full bg-[#e7684a] px-6 text-sm font-bold text-white shadow-[5px_5px_0_#16263b] transition hover:-translate-y-0.5 hover:bg-[#d9593d]"
                >
                  Analyze my resume <ArrowUpRight size={17} />
                </Button>
                <button
                  onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 text-sm font-bold text-[#16263b] underline decoration-[#e7684a] decoration-2 underline-offset-4"
                >
                  How JOBLENS works <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="hero-art relative min-h-[400px] animate-rise animate-delay-1">
              <div className="absolute inset-6 rotate-2 rounded-[2rem] bg-[#e3b65b] opacity-60" />
              <img
                src="/assets/joblens-hero.svg"
                alt="Abstract lens examining a resume"
                className="relative h-full min-h-[400px] w-full rounded-[2rem] object-cover shadow-[12px_12px_0_#16263b]"
              />
              <div className="absolute -bottom-5 -left-5 rounded-2xl bg-[#fffdf8] p-4 shadow-xl border border-[#ded5c5]">
                <div className="eyebrow text-[#657180]">CURRENT READINESS</div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-display text-4xl">
                    {analysisResult ? `${analysisResult.overallScore}%` : "—"}
                  </span>
                  <span className="mb-1 text-xs text-[#657180]">
                    {analysisResult ? `${analysisResult.jobTitle}` : "Upload resume to see yours"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div id="how" className="mt-32 grid gap-8 border-t border-[#ded5c5] pt-8 md:grid-cols-[.8fr_2fr]">
            <div>
              <div className="eyebrow text-[#e7684a]">A BETTER WAY TO PREPARE</div>
              <h2 className="font-display mt-3 max-w-xs text-4xl leading-none tracking-[-.05em]">
                Less guessing.<br />
                More signal.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["01", "Choose your target role", "Select from built-in roles or add any custom position."],
                ["02", "Upload your resume", "We extract real evidence hiding in your PDF, DOCX, or TXT."],
                ["03", "Make your next move", "See missing skills, ATS score, and tailored interview prep."],
              ].map(([n, title, body], i) => (
                <div key={n} className={`paper-panel rounded-2xl p-5 ${i === 1 ? "md:translate-y-5" : ""}`}>
                  <div className="font-display text-3xl text-[#e7684a]">{n}</div>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#657180]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SETUP SECTION */}
          <section id="setup" className="mt-36 scroll-mt-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#ded5c5] pb-6 md:flex-row md:items-end">
              <div>
                <div className="eyebrow text-[#e7684a]">START YOUR ANALYSIS</div>
                <h2 className="font-display mt-3 text-5xl leading-none tracking-[-.06em]">
                  Put your next role<br />
                  in focus.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#657180]">
                No perfect resume required. Just an honest starting point.
              </p>
            </div>

            <div className="mt-8 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
              {/* STEP 1: ROLE SELECTION & MANAGEMENT */}
              <div className="paper-panel rounded-[1.5rem] p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <label className="eyebrow text-[#657180]">01 / TARGET ROLE</label>
                  <button
                    onClick={handleOpenAddRole}
                    className="flex items-center gap-1 text-xs font-bold text-[#e7684a] hover:underline"
                  >
                    <Plus size={15} /> Add new role
                  </button>
                </div>

                <div className="relative mt-5">
                  <Search className="absolute left-4 top-3.5 text-[#9aa3aa]" size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search roles or skills..."
                    className="h-12 w-full rounded-xl border border-[#ded5c5] bg-[#f6f1e7] pl-11 pr-4 text-sm outline-none transition focus:border-[#e7684a]"
                  />
                </div>

                <div className="mt-5 grid gap-3 max-h-[380px] overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredRoles.map((r) => {
                    const isSelected = selectedRoleId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoleId(r.id)}
                        className={`group relative rounded-xl border p-4 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[#e7684a] bg-[#fff5ef] shadow-[3px_3px_0_#e7684a]"
                            : "border-[#ded5c5] bg-transparent hover:bg-[#fffdf8]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold truncate pr-4">{r.title}</span>
                          {isSelected && <Check size={16} className="text-[#e7684a] shrink-0" />}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[.68rem] font-bold uppercase tracking-wider text-[#e7684a]">
                          <span>{r.category}</span>
                          <span>{r.company}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#657180] line-clamp-2">
                          {r.description}
                        </p>

                        {!r.isDefault && (
                          <div className="mt-3 flex items-center gap-2 border-t border-[#ded5c5]/60 pt-2 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => handleOpenEditRole(r, e)}
                              className="text-xs font-semibold text-[#16263b] flex items-center gap-1 hover:text-[#e7684a]"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteRole(r.id, e)}
                              className="text-xs font-semibold text-[#a4432e] flex items-center gap-1 hover:underline ml-auto"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: RESUME UPLOAD */}
              <div className="rounded-[1.5rem] bg-[#e7dfd1] p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <label className="eyebrow text-[#657180]">02 / YOUR RESUME</label>
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-5 flex min-h-[258px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#b8ae9e] bg-[#f6f1e7]/70 p-6 text-center transition-all duration-200 hover:border-[#e7684a] hover:bg-[#fffdf8]"
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                      }}
                    />
                    {file ? (
                      <>
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#668f7b] text-white animate-rise">
                          <FileCheck size={28} />
                        </div>
                        <div className="mt-4 text-sm font-bold">{file.name}</div>
                        <div className="mt-1 text-xs text-[#657180]">
                          {parsedResume
                            ? `Extracted text ready (${parsedResume.extractedText.length} chars)`
                            : "Uploading & extracting..."}{" "}
                          · {(file.size / 1024).toFixed(0)} KB
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setParsedResume(null);
                            setAnalysisResult(null);
                          }}
                          className="mt-4 flex items-center gap-1 text-xs font-bold text-[#e7684a]"
                        >
                          Remove resume <X size={14} />
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#16263b] text-[#fffaf2]">
                          <Upload />
                        </div>
                        <div className="mt-4 text-sm font-bold">Drop your resume here</div>
                        <div className="mt-1 text-xs text-[#657180]">
                          PDF, DOCX, or TXT · up to 10 MB
                        </div>
                        <span className="mt-4 text-xs font-bold text-[#e7684a]">Browse files</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <div className="mb-3 text-xs text-[#657180]">
                    Target role: <strong className="text-[#16263b]">{selectedRole.title}</strong>
                  </div>
                  <Button
                    onClick={analyze}
                    disabled={!file || isUploading || !parsedResume}
                    className="h-12 w-full rounded-full bg-[#16263b] text-sm font-bold text-[#fffaf2] transition hover:bg-[#263b55] disabled:opacity-50"
                  >
                    Analyze with JOBLENS <ArrowUpRight size={17} />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>

      {/* MODALS */}
      <RoleModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        roleToEdit={roleToEdit}
        onSaveRole={handleSaveRoleCallback}
      />

      <AppDialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        title="How JOBLENS Analysis Works"
        description="JOBLENS parses your uploaded PDF, DOCX, or TXT resume to extract skills, section structures, and employment history. It compares these extracted signals against your selected job role requirements using a deterministic matching engine, generating an explainable match score, missing skills list, ATS compatibility metrics, and targeted interview prep questions."
      />

      <AppDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        title="Your JOBLENS Workspace"
        description="All analysis calculations, parsing, and interview question preparation are performed locally. Your target roles are saved to local persistent storage."
      />
    </div>
  );
}

// RESULTS VIEW COMPONENT
function ResultsView({
  result,
  role,
  activeTab,
  setActiveTab,
  reset,
  onOpenQuestion,
}: {
  result: AnalysisResult;
  role: JobRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reset: () => void;
  onOpenQuestion: (q: any) => void;
}) {
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [expandedScoreCard, setExpandedScoreCard] = useState<string | null>(null);

  const tabs = ["Overview", "Skills", "Resume quality", "Interview prep"];

  const toggleScoreCard = (cardName: string) => {
    setExpandedScoreCard((prev) => (prev === cardName ? null : cardName));
  };

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-[#16263b] animate-rise">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-[#ded5c5] bg-[#16263b] px-6 py-5 text-white md:px-12">
        <Logo />
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportPDFPrint(result)}
            className="hidden rounded-full border border-white/20 px-4 py-2 text-xs font-bold md:block hover:bg-white/10 transition"
          >
            Export PDF
          </button>
          <button
            onClick={reset}
            className="rounded-full bg-[#e7684a] px-4 py-2 text-xs font-bold text-white shadow-[2px_2px_0_#fff] hover:bg-[#d9593d] transition"
          >
            New analysis
          </button>
        </div>
      </header>

      {/* CANVAS */}
      <main className="mx-auto max-w-[1240px] px-6 py-10 md:px-12">
        {/* BANNER */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#ded5c5] pb-8 md:flex-row md:items-end">
          <div>
            <div className="eyebrow text-[#e7684a]">
              ANALYSIS COMPLETE · {result.filename}
            </div>
            <h1 className="font-display mt-3 text-5xl leading-none tracking-[-.06em] md:text-6xl">
              Your fit, in focus.
            </h1>
            <p className="mt-4 text-sm text-[#657180]">
              Target role: <strong className="text-[#16263b]">{result.jobTitle}</strong> · Reviewed just now
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* HIRING READINESS (JOB MATCH) */}
            <div className="rounded-2xl bg-[#fffdf8] px-5 py-4 shadow-sm border border-[#ded5c5]">
              <div className="eyebrow text-[#657180]">HIRING READINESS</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-display text-4xl" style={{ color: getScoreColor(result.overallScore) }}>
                  {result.overallScore}%
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold uppercase"
                  style={{
                    color: getScoreColor(result.overallScore),
                    backgroundColor: `${getScoreColor(result.overallScore)}22`,
                  }}
                >
                  {result.selectionLikelihood} FIT
                </span>
              </div>
            </div>

            {/* STANDALONE RESUME QUALITY */}
            <div className="rounded-2xl bg-[#fffdf8] px-5 py-4 shadow-sm border border-[#ded5c5]">
              <div className="eyebrow text-[#657180]">RESUME QUALITY</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-display text-4xl" style={{ color: getScoreColor(result.overallResumeQuality) }}>
                  {result.overallResumeQuality}%
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold uppercase"
                  style={{
                    color: getScoreColor(result.overallResumeQuality),
                    backgroundColor: `${getScoreColor(result.overallResumeQuality)}22`,
                  }}
                >
                  RESUME HEALTH
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-[#ded5c5]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "border-[#e7684a] text-[#e7684a]"
                  : "border-transparent text-[#657180] hover:text-[#16263b]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "Overview" && (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="paper-panel rounded-2xl p-5 md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="eyebrow text-[#657180]">JOB MATCH SCORE</div>
                      <div
                        className="mt-2 font-display text-6xl tracking-[-.06em]"
                        style={{ color: getScoreColor(result.overallScore) }}
                      >
                        {result.overallScore}%
                      </div>
                    </div>
                    <Target className="text-[#e7684a]" size={28} />
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9e2d5]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${result.overallScore}%`,
                        backgroundColor: getScoreColor(result.overallScore),
                      }}
                    />
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[#657180]">
                    {result.strengths[0] || "Identified evidence across resume sections."}{" "}
                    {result.missingSkills.length > 0 && (
                      <>
                        Gaps identified in:{" "}
                        <span className="font-semibold text-[#16263b]">
                          {result.missingSkills.slice(0, 3).join(", ")}
                        </span>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#e7684a] p-5 text-white flex flex-col justify-between">
                <div>
                  <Lightbulb size={24} />
                  <div className="eyebrow mt-9 text-white/70">NEXT BEST MOVE</div>
                  <h3 className="mt-2 font-display text-3xl leading-none">Prepare your story.</h3>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    {result.recommendations[0] || "Review missing requirements and practice behavioral answers."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("Interview prep")}
                  className="mt-6 flex items-center gap-1 text-sm font-bold underline underline-offset-4"
                >
                  Open interview prep <ArrowUpRight size={15} />
                </button>
              </div>
            </div>

            {/* QUICK FIXES PILL LIST */}
            {result.quickFixes && result.quickFixes.length > 0 && (
              <div className="mt-8 paper-panel rounded-2xl p-6">
                <div className="eyebrow text-[#e7684a] flex items-center gap-2">
                  <Sparkles size={14} /> QUICK FIXES BEFORE APPLYING
                </div>
                <h3 className="font-display mt-2 text-2xl">High-Impact Adjustments</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {result.quickFixes.map((fix, idx) => (
                    <div key={idx} className="rounded-xl border border-[#ded5c5] bg-[#fffdf8] p-4 text-xs leading-5">
                      <strong className="text-[#e7684a] font-bold block mb-1">0{idx + 1} Action Item</strong>
                      <span className="text-[#16263b] font-medium">{fix}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="paper-panel rounded-2xl p-5">
                <Score value={result.skillMatchScore} label="Skill Match" />
              </div>
              <div className="paper-panel rounded-2xl p-5">
                <Score value={result.experienceScore} label="Experience" />
              </div>
              <div className="paper-panel rounded-2xl p-5">
                <Score value={result.atsScore} label="ATS Compatibility" />
              </div>
              <div className="paper-panel rounded-2xl p-5">
                <Score value={result.educationStructureScore} label="Structure" />
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="paper-panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow text-[#657180]">WHAT WE FOUND</div>
                    <h2 className="font-display mt-2 text-3xl">Resume strengths</h2>
                  </div>
                  <BarChart3 className="text-[#e7684a]" />
                </div>
                <div className="mt-6 space-y-4">
                  {result.strengths.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#dcebe2] text-[#35634c]">
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#e7dfd1] p-6 flex flex-col justify-between">
                <div>
                  <div className="eyebrow text-[#657180]">ESTIMATE, NOT A PROMISE</div>
                  <h2 className="font-display mt-2 text-3xl">Selection likelihood</h2>
                  <div className="mt-5 flex items-end gap-3">
                    <span className="font-display text-5xl">{result.selectionLikelihood}</span>
                    <span
                      className="mb-2 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{
                        color: getRiskColor(result.rejectionRisk),
                        backgroundColor: `${getRiskColor(result.rejectionRisk)}22`,
                      }}
                    >
                      {result.rejectionRisk}% rejection risk
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#657180]">
                    This estimate reflects your uploaded resume content compared against {result.jobTitle} requirements. Actual hiring outcomes depend on interview performance and recruiters.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: SKILLS */}
        {activeTab === "Skills" && (
          <div className="mt-8 paper-panel rounded-2xl p-6">
            <div className="eyebrow text-[#e7684a]">SKILL SIGNALS</div>
            <h2 className="font-display mt-2 text-4xl">Relevant skills, honestly read.</h2>
            <div className="mt-7 space-y-3">
              {result.skills.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#ded5c5] p-4 sm:flex-row sm:items-center transition hover:bg-[#fffdf8]"
                >
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="mt-1 text-xs text-[#657180]">{s.detail}</div>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      s.state === "Matched"
                        ? "bg-[#dcebe2] text-[#35634c]"
                        : s.state === "Transferable"
                        ? "bg-[#fbefcf] text-[#876621]"
                        : "bg-[#f9ddd6] text-[#a4432e]"
                    }`}
                  >
                    {s.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RESUME QUALITY */}
        {activeTab === "Resume quality" && (
          <div className="mt-8 space-y-10">
            {/* OVERALL RESUME HEALTH BANNER */}
            <div className="paper-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="eyebrow text-[#e7684a]">STANDALONE RESUME HEALTH</div>
                <h2 className="font-display mt-2 text-4xl">Overall Resume Quality</h2>
                <p className="mt-2 text-sm text-[#657180] max-w-xl">
                  Evaluates document completeness, quantified achievement metrics, structure, and text parseability independently of target job roles.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="font-display text-5xl" style={{ color: getScoreColor(result.overallResumeQuality) }}>
                    {result.overallResumeQuality}%
                  </div>
                  <div className="text-xs font-bold text-[#657180] uppercase">
                    {result.overallResumeQuality >= 80 ? "Excellent" : result.overallResumeQuality >= 60 ? "Good" : "Needs Improvement"}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 RESUME QUALITY CATEGORIES */}
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { key: "content", title: "Content", detail: result.resumeQuality.content },
                { key: "flow", title: "Flow & Structure", detail: result.resumeQuality.flow },
                { key: "presentation", title: "Presentation & ATS Readability", detail: result.resumeQuality.presentation },
                { key: "ats", title: "ATS Compatibility", detail: result.resumeQuality.ats },
              ].map(({ key, title, detail }) => {
                const isExpanded = expandedScoreCard === key;
                return (
                  <div key={key} className="paper-panel rounded-2xl p-6 flex flex-col justify-between transition hover:-translate-y-0.5">
                    <div>
                      <div className="flex items-end justify-between">
                        <div className="eyebrow text-[#657180]">{title}</div>
                        <span className="font-display text-4xl" style={{ color: getScoreColor(detail.score) }}>
                          {detail.score}%
                        </span>
                      </div>
                      <div className="mt-4 h-1.5 rounded-full bg-[#e9e2d5]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${detail.score}%`, backgroundColor: getScoreColor(detail.score) }}
                        />
                      </div>
                      <p className="mt-4 text-sm leading-6 text-[#657180]">{detail.summary}</p>
                    </div>

                    <div className="mt-5 border-t border-[#ded5c5] pt-3">
                      <button
                        onClick={() => toggleScoreCard(key)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#e7684a] hover:underline"
                      >
                        {isExpanded ? "Hide breakdown" : "Why this score?"} <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {isExpanded && detail.metrics && (
                        <div className="mt-4 space-y-3 bg-[#fffdf8] rounded-xl p-4 border border-[#ded5c5] text-xs animate-rise">
                          {detail.metrics.map((m) => (
                            <div key={m.name} className="flex flex-col gap-1 border-b border-[#ded5c5]/50 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between font-bold text-[#16263b]">
                                <span>{m.name}</span>
                                <span style={{ color: getScoreColor(m.score) }}>{m.score}%</span>
                              </div>
                              <span className="text-[#657180]">{m.explanation}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DYNAMIC IMPROVEMENTS SECTION */}
            {result.improvements && result.improvements.length > 0 && (
              <div className="paper-panel rounded-2xl p-6 md:p-8">
                <div className="eyebrow text-[#e7684a]">ACTIONABLE FEEDBACK</div>
                <h2 className="font-display mt-2 text-4xl">How to Improve Your Resume</h2>
                <p className="mt-2 text-sm text-[#657180] max-w-xl">
                  Prioritized recommendations generated from your actual resume evidence to maximize interview callback rates.
                </p>

                <div className="mt-8 space-y-4">
                  {result.improvements.map((imp: ResumeImprovement) => (
                    <div
                      key={imp.id}
                      className="rounded-xl border border-[#ded5c5] bg-[#fffdf8] p-5 shadow-sm transition hover:border-[#e7684a]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ded5c5]/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[.65rem] font-bold uppercase tracking-wider ${
                              imp.priority === "high"
                                ? "bg-[#f9ddd6] text-[#a4432e]"
                                : imp.priority === "medium"
                                ? "bg-[#fbefcf] text-[#876621]"
                                : "bg-[#e9e2d5] text-[#657180]"
                            }`}
                          >
                            {imp.priority} PRIORITY
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#7d8791]">
                            {imp.category}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-display mt-3 text-xl">{imp.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#657180]">{imp.explanation}</p>

                      <div className="mt-4 rounded-lg bg-[#f6f1e7] p-3 text-xs text-[#16263b] border border-[#ded5c5]/80">
                        <strong className="text-[#a4432e] font-bold">Evidence:</strong> {imp.evidence}
                      </div>

                      <div className="mt-3 text-xs font-semibold text-[#35634c]">
                        💡 <strong>Recommendation:</strong> {imp.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INTERVIEW PREP */}
        {activeTab === "Interview prep" && (
          <div className="mt-8 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
            <div className="rounded-2xl bg-[#16263b] p-7 text-white flex flex-col justify-between">
              <div>
                <Sparkles className="text-[#e7684a]" />
                <div className="eyebrow mt-10 text-[#9caaba]">YOUR PREP PLAN</div>
                <h2 className="font-display mt-2 text-4xl leading-none">Turn evidence into answers.</h2>
                <p className="mt-4 text-sm leading-6 text-[#bdc7d0]">
                  Practice the stories behind your strongest signals for {result.jobTitle}.
                </p>
                <div className="mt-8 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <Check className="text-[#e7684a]" size={17} /> Impact story from recent experience
                  </div>
                  <div className="flex gap-3">
                    <Check className="text-[#e7684a]" size={17} /> Addressing missing requirement ({result.missingSkills[0] || 'core tool'})
                  </div>
                  <div className="flex gap-3">
                    <Check className="text-[#e7684a]" size={17} /> Technical/operational problem solving
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {result.interviewQuestions.map((q, idx) => (
                <div key={q.id} className="paper-panel rounded-2xl p-7 transition hover:-translate-y-0.5">
                  <div className="eyebrow text-[#e7684a]">QUESTION 0{idx + 1}</div>
                  <h2 className="font-display mt-2 text-2xl">{q.question}</h2>
                  <div className="mt-5 grid gap-4 border-t border-[#ded5c5] pt-4 sm:grid-cols-3">
                    <div>
                      <div className="eyebrow text-[#657180]">THEY'RE TESTING</div>
                      <p className="mt-1 text-xs leading-5 text-[#657180]">{q.testing}</p>
                    </div>
                    <div>
                      <div className="eyebrow text-[#35634c]">MENTION</div>
                      <p className="mt-1 text-xs leading-5 text-[#657180]">{q.mention}</p>
                    </div>
                    <div>
                      <div className="eyebrow text-[#a4432e]">AVOID</div>
                      <p className="mt-1 text-xs leading-5 text-[#657180]">{q.avoid}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedQuestion(q);
                      setInterviewModalOpen(true);
                    }}
                    className="mt-5 flex items-center gap-2 text-sm font-bold text-[#e7684a] hover:underline"
                  >
                    Draft your answer <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#ded5c5] pt-6">
          <p className="max-w-xl text-xs leading-5 text-[#657180]">
            JOBLENS estimates reflect resume content matching algorithms. It does not infer protected characteristics.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => exportCSV(result)}
              className="rounded-full border border-[#bdb3a3] px-4 py-2 text-xs font-bold hover:bg-[#e9e2d5] transition"
            >
              CSV
            </button>
            <button
              onClick={() => exportExcel(result)}
              className="rounded-full border border-[#bdb3a3] px-4 py-2 text-xs font-bold hover:bg-[#e9e2d5] transition"
            >
              Excel
            </button>
            <button
              onClick={() => exportPDFPrint(result)}
              className="rounded-full bg-[#16263b] px-4 py-2 text-xs font-bold text-white hover:bg-[#263b55] transition"
            >
              PDF report
            </button>
          </div>
        </div>
      </main>

      {/* INTERVIEW ANSWER MODAL */}
      <InterviewModal
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
        analysisId={result.analysisId}
        questionItem={selectedQuestion}
      />
    </div>
  );
}
