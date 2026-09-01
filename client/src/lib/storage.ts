import { JobRole, SavedAnswer } from "@shared/types";

const CUSTOM_ROLES_KEY = "joblens_custom_roles";
const INTERVIEW_ANSWERS_KEY = "joblens_interview_answers";

/** Safe localStorage getter with error isolation */
function getItemSafe(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn(`[storage] Could not access localStorage for key "${key}":`, err);
  }
  return null;
}

/** Safe localStorage setter with error isolation */
function setItemSafe(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn(`[storage] Could not write to localStorage for key "${key}":`, err);
  }
}

/** Retrieve valid custom roles stored in browser localStorage */
export function getStoredCustomRoles(): JobRole[] {
  const raw = getItemSafe(CUSTOM_ROLES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate role schema integrity
    return parsed.filter(
      (r: any) =>
        r &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.title === "string" &&
        Array.isArray(r.requiredSkills)
    ) as JobRole[];
  } catch (e) {
    console.warn("[storage] Corrupted custom roles JSON in localStorage. Resetting.");
    return [];
  }
}

/** Persist array of custom roles to localStorage */
export function saveStoredCustomRoles(roles: JobRole[]): void {
  const customOnly = roles.filter((r) => !r.isDefault);
  setItemSafe(CUSTOM_ROLES_KEY, JSON.stringify(customOnly));
}

/** Add or update a custom role in localStorage */
export function saveStoredCustomRole(role: JobRole): JobRole[] {
  const existing = getStoredCustomRoles();
  const idx = existing.findIndex((r) => r.id === role.id);
  let updated: JobRole[];
  if (idx >= 0) {
    updated = [...existing];
    updated[idx] = { ...role, isDefault: false };
  } else {
    updated = [{ ...role, isDefault: false }, ...existing];
  }
  saveStoredCustomRoles(updated);
  return updated;
}

/** Remove a custom role by ID from localStorage */
export function deleteStoredCustomRole(roleId: string): JobRole[] {
  const existing = getStoredCustomRoles();
  const filtered = existing.filter((r) => r.id !== roleId);
  saveStoredCustomRoles(filtered);
  return filtered;
}

/** Retrieve saved interview answers from localStorage */
export function getStoredAnswers(analysisId?: string): SavedAnswer[] {
  const raw = getItemSafe(INTERVIEW_ANSWERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (a: any) => a && typeof a === "object" && typeof a.analysisId === "string" && typeof a.questionId === "string"
    ) as SavedAnswer[];
    if (analysisId) {
      return valid.filter((a) => a.analysisId === analysisId);
    }
    return valid;
  } catch (e) {
    console.warn("[storage] Corrupted interview answers JSON in localStorage.");
    return [];
  }
}

/** Save an interview answer entry into localStorage */
export function saveStoredAnswer(analysisId: string, questionId: string, answerText: string): SavedAnswer {
  const existing = getStoredAnswers();
  const idx = existing.findIndex((a) => a.analysisId === analysisId && a.questionId === questionId);
  const entry: SavedAnswer = {
    analysisId,
    questionId,
    answer: answerText,
    updatedAt: new Date().toISOString(),
  };

  let updated: SavedAnswer[];
  if (idx >= 0) {
    updated = [...existing];
    updated[idx] = entry;
  } else {
    updated = [...existing, entry];
  }

  setItemSafe(INTERVIEW_ANSWERS_KEY, JSON.stringify(updated));
  return entry;
}
