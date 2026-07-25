import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** A stable unique id. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Current time as an ISO string. */
export function now(): string {
  return new Date().toISOString();
}
