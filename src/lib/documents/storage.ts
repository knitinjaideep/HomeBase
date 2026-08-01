"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Thin wrappers around the private "documents" Storage bucket (see
 * supabase/migrations/0024/0025). Objects are addressed as
 * "{householdId}/{documentId}/{fileName}" — RLS on the bucket checks
 * household membership against the first path segment, so every call here
 * must be scoped to a real document row's id and its household.
 *
 * The bucket is private: there is no public URL. Viewing/downloading a file
 * always goes through a short-lived signed URL, generated on demand — never
 * stored — so a stale link can't outlive the household's access to it.
 */

const BUCKET = "documents";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60;

/** Strips path separators so a crafted filename can never escape the document's own folder. */
function sanitizeFileName(name: string): string {
  return name.replace(/[/\\]/g, "_").trim() || "file";
}

export interface UploadedDocumentFile {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
}

export async function uploadDocumentFile(
  householdId: string,
  documentId: string,
  file: File,
): Promise<UploadedDocumentFile> {
  const fileName = sanitizeFileName(file.name);
  const filePath = `${householdId}/${documentId}/${fileName}`;
  const { error } = await createClient().storage.from(BUCKET).upload(filePath, file, { upsert: true });
  if (error) throw new Error(error.message);
  return { filePath, fileName, fileSize: file.size, fileMimeType: file.type || "application/octet-stream" };
}

export async function getDocumentFileUrl(filePath: string): Promise<string> {
  const { data, error } = await createClient()
    .storage.from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN_SECONDS);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Best-effort — a failed cleanup should never block deleting the document's index row. */
export async function deleteDocumentFile(filePath: string): Promise<void> {
  const { error } = await createClient().storage.from(BUCKET).remove([filePath]);
  if (error) console.error("Failed to remove document file from storage:", error.message);
}
