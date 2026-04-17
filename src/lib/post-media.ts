import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export const POST_MEDIA_BUCKET = "post-media";
export const MAX_MEDIA_FILE_SIZE_BYTES = 40 * 1024 * 1024;

export function buildSafeFileName(fileName: string): string {
  const sanitized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized.length > 0 ? sanitized : "media-file";
}

export function buildMediaStoragePath(userId: string, postId: string, originalFileName: string): string {
  const dayKey = new Date().toISOString().slice(0, 10);
  const safeFileName = buildSafeFileName(originalFileName);
  return `${userId}/${dayKey}/${postId}-${crypto.randomUUID()}-${safeFileName}`;
}

export function errorDetailFromUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = "code" in error ? String(error.code) : null;
    const maybeMessage = "message" in error ? String(error.message) : null;
    const maybeDetails = "details" in error ? String(error.details) : null;
    const maybeHint = "hint" in error ? String(error.hint) : null;

    return [maybeCode, maybeMessage, maybeDetails, maybeHint]
      .filter((value): value is string => Boolean(value))
      .join(" | ");
  }

  return "Errore sconosciuto";
}

export function mapStorageUploadErrorToMessage(error: unknown): string {
  const detail = errorDetailFromUnknown(error).toLowerCase();

  if (detail.includes("bucket") && detail.includes("not found")) {
    return "Bucket media non trovato. Applica le migrazioni Storage e riprova.";
  }

  if (detail.includes("mime") || detail.includes("invalid mime")) {
    return "Formato file non supportato dal bucket media. Verifica configurazione Storage.";
  }

  if (detail.includes("row-level security") || detail.includes("policy")) {
    return "Upload bloccato dalle policy Storage. Verifica RLS del bucket post-media.";
  }

  return "Upload media non riuscito. Verifica bucket Storage e policy.";
}

export function extractStorageObjectPathFromPublicUrl(publicUrl: string): string | null {
  const trimmedValue = publicUrl.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  try {
    const { url } = getSupabaseEnv();
    const parsedPublicUrl = new URL(trimmedValue);
    const expectedPrefix = new URL(
      `/storage/v1/object/public/${POST_MEDIA_BUCKET}/`,
      url,
    ).pathname;

    if (!parsedPublicUrl.pathname.startsWith(expectedPrefix)) {
      return null;
    }

    const decodedPath = decodeURIComponent(parsedPublicUrl.pathname.slice(expectedPrefix.length));
    return decodedPath.length > 0 ? decodedPath : null;
  } catch {
    return null;
  }
}

export async function removePostMediaFromStorage(
  supabase: SupabaseClient<Database>,
  mediaUrls: string[],
): Promise<void> {
  const storagePaths = mediaUrls
    .map((mediaUrl) => extractStorageObjectPathFromPublicUrl(mediaUrl))
    .filter((storagePath): storagePath is string => Boolean(storagePath));

  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(POST_MEDIA_BUCKET).remove(storagePaths);
  if (error) {
    throw error;
  }
}
