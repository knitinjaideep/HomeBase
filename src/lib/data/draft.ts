"use client";

/**
 * Local unsaved-form-draft protection (section 9/11 of the deployment plan):
 * poor connectivity should never destroy typed notes. Used for the property
 * visit form's notes — write on every change, clear only after a *confirmed*
 * successful Supabase save. This is deliberately not a general offline queue
 * — it's just "don't lose what you typed."
 */

function draftKey(key: string): string {
  return `homescope:draft:${key}`;
}

export function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(draftKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(key: string, value: T): void {
  try {
    localStorage.setItem(draftKey(key), JSON.stringify(value));
  } catch {
    /* localStorage may be unavailable — the draft is best-effort, not the primary save path */
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(draftKey(key));
  } catch {
    /* ignore */
  }
}
