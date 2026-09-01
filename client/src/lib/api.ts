import { JobRole, ParsedResume, AnalysisResult, SavedAnswer } from "@shared/types";

export type ApiErrorCode =
  | "OFFLINE"
  | "SERVER_UNAVAILABLE"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "FILE_TOO_LARGE"
  | "PARSE_ERROR"
  | "ANALYSIS_FAILED"
  | "API_ERROR"
  | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  userMessage: string;

  constructor(message: string, code: ApiErrorCode = "UNKNOWN", status: number = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.userMessage = message;
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/** Check if running on local development host (localhost or 127.0.0.1) */
export function isLocalDev(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (host === "localhost" || host === "127.0.0.1") && !import.meta.env.PROD;
}

/** Retrieve relative API Base URL ("" for same-domain / relative routing) */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || "";
}

/** Perform health check call to /api/health */
export async function checkServerHealth(timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${getApiBaseUrl()}/api/health`;
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data?.status === "ok";
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/** Central apiFetch helper enforcing relative /api routing and environment-aware error handling */
export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, ...fetchOptions } = options;

  // 1. Check browser navigator.onLine state
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new ApiError(
      "You appear to be offline. Please check your internet or network connection.",
      "OFFLINE",
      0
    );
  }

  // 2. Resolve final request URL (always relative /api/... by default)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  // 3. Setup timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text().catch(() => "");
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }
      }
    }

    if (!response.ok || (data && data.success === false)) {
      const status = response.status;
      let errorCode: ApiErrorCode = data?.code || "API_ERROR";

      if (status === 413 || errorCode === "FILE_TOO_LARGE") {
        errorCode = "FILE_TOO_LARGE";
      } else if (status === 404) {
        errorCode = "NOT_FOUND";
      } else if (status === 422 || errorCode === "PARSE_ERROR") {
        errorCode = "PARSE_ERROR";
      } else if (status >= 500) {
        errorCode = "SERVER_UNAVAILABLE";
      }

      const message =
        data?.error ||
        data?.message ||
        `Server returned status ${status} (${response.statusText || "Error"})`;

      throw new ApiError(message, errorCode, status);
    }

    if (!data) {
      throw new ApiError(
        "Server returned an empty response. Please try again.",
        "PARSE_ERROR",
        response.status
      );
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === "AbortError") {
      throw new ApiError(
        "The request timed out. Please try again.",
        "TIMEOUT",
        408
      );
    }

    // Network error or server connection refused
    const isServerReachable = await checkServerHealth(2000);
    if (!isServerReachable) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new ApiError(
          "You're offline. Please check your network connection.",
          "OFFLINE",
          0
        );
      }
      const unavailableMsg = isLocalDev()
        ? "We couldn't connect to the local JOBLENS server. Please verify the server is running (pnpm dev)."
        : "JOBLENS service is temporarily unavailable. Please check your network connection or try again in a moment.";
      throw new ApiError(unavailableMsg, "SERVER_UNAVAILABLE", 503);
    }

    throw new ApiError(
      err.message || "A network connection error occurred.",
      "UNKNOWN",
      0
    );
  }
}

/**
 * Central API Client Interface
 * All frontend API calls MUST go through this object.
 */
export const api = {
  /** Health check endpoint GET /api/health */
  getHealth: async (timeoutMs = 3000) => {
    return apiFetch<{ status: string; service: string; timestamp?: string }>("/api/health", {
      method: "GET",
      timeoutMs,
    });
  },

  /** Get default & custom job roles GET /api/roles */
  getRoles: async (timeoutMs = 5000) => {
    return apiFetch<{ success: boolean; roles: JobRole[] }>("/api/roles", {
      method: "GET",
      timeoutMs,
    });
  },

  /** Create custom job role POST /api/roles */
  createRole: async (roleData: Partial<JobRole>, timeoutMs = 8000) => {
    return apiFetch<{ success: boolean; role: JobRole }>("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleData),
      timeoutMs,
    });
  },

  /** Update job role PUT /api/roles/:id */
  updateRole: async (id: string, roleData: Partial<JobRole>, timeoutMs = 8000) => {
    return apiFetch<{ success: boolean; role: JobRole }>(`/api/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleData),
      timeoutMs,
    });
  },

  /** Delete job role DELETE /api/roles/:id */
  deleteRole: async (id: string, timeoutMs = 8000) => {
    return apiFetch<{ success: boolean; deletedId: string }>(`/api/roles/${id}`, {
      method: "DELETE",
      timeoutMs,
    });
  },

  /** Upload resume file POST /api/resume/upload (4 MB max limit) */
  uploadResume: async (file: File, timeoutMs = 30000) => {
    if (file.size > 4 * 1024 * 1024) {
      throw new ApiError(
        "The uploaded file exceeds the 4 MB size limit. Please upload a resume under 4 MB.",
        "FILE_TOO_LARGE",
        413
      );
    }
    const formData = new FormData();
    formData.append("resume", file);

    return apiFetch<{ success: boolean; resume: ParsedResume }>("/api/resume/upload", {
      method: "POST",
      body: formData,
      timeoutMs,
    });
  },

  /** Analyze uploaded resume text against target role POST /api/analyze */
  analyzeResume: async (parsedResume: ParsedResume, role: JobRole, timeoutMs = 20000) => {
    return apiFetch<{ success: boolean; result: AnalysisResult }>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsedResume, role }),
      timeoutMs,
    });
  },

  /** Fetch saved interview answers GET /api/answers/:analysisId */
  getAnswers: async (analysisId: string, timeoutMs = 5000) => {
    return apiFetch<{ success: boolean; answers: SavedAnswer[] }>(`/api/answers/${analysisId}`, {
      method: "GET",
      timeoutMs,
    });
  },

  /** Save interview answer POST /api/answers */
  saveAnswer: async (analysisId: string, questionId: string, answer: string, timeoutMs = 5000) => {
    return apiFetch<{ success: boolean; answer: SavedAnswer }>("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, questionId, answer }),
      timeoutMs,
    });
  },
};
