export type ApiErrorCode =
  | "OFFLINE"
  | "SERVER_UNAVAILABLE"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "API_ERROR"
  | "PARSE_ERROR"
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

export async function checkServerHealth(timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/health", {
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

export async function apiFetch<T = any>(
  url: string,
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

  // 2. Setup timeout controller
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
      let errorCode: ApiErrorCode = "API_ERROR";

      if (status === 404) errorCode = "NOT_FOUND";
      else if (status >= 500) errorCode = "SERVER_UNAVAILABLE";

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
      throw new ApiError(
        "We couldn't connect to the local JOBLENS server. Please verify the server is running.",
        "SERVER_UNAVAILABLE",
        503
      );
    }

    throw new ApiError(
      err.message || "A network connection error occurred.",
      "UNKNOWN",
      0
    );
  }
}
