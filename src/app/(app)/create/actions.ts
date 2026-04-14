"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile, getPassionCatalog } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type ContentType = "text" | "image" | "video";
const POST_MEDIA_BUCKET = "post-media";
const MAX_MEDIA_FILE_SIZE_BYTES = 40 * 1024 * 1024;

function isValidContentType(value: string): value is ContentType {
  return value === "text" || value === "image" || value === "video";
}

function toUploadedFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function isCompatibleMediaFile(contentType: ContentType, file: File): boolean {
  if (contentType === "image") {
    return file.type.startsWith("image/");
  }

  if (contentType === "video") {
    return file.type.startsWith("video/");
  }

  return false;
}

function buildSafeFileName(fileName: string): string {
  const sanitized = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized.length > 0 ? sanitized : "media-file";
}

function buildMediaStoragePath(userId: string, postId: string, originalFileName: string): string {
  const dayKey = new Date().toISOString().slice(0, 10);
  const safeFileName = buildSafeFileName(originalFileName);
  return `${userId}/${dayKey}/${postId}-${crypto.randomUUID()}-${safeFileName}`;
}

function redirectCreateError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/create?${params.toString()}`);
}

function errorDetailFromUnknown(error: unknown): string {
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

export async function createPostAction(formData: FormData): Promise<never> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch {
    redirectCreateError("Profilo utente non sincronizzato. Ricarica e riprova.");
  }

  const contentTypeRaw = formData.get("contentType");
  const textContentRaw = formData.get("textContent");
  const mediaFileRaw = formData.get("mediaFile");
  const passionSlugRaw = formData.get("passionSlug");

  if (
    typeof contentTypeRaw !== "string" ||
    !isValidContentType(contentTypeRaw) ||
    typeof passionSlugRaw !== "string" ||
    !passionSlugRaw
  ) {
    redirectCreateError("Compila i campi obbligatori prima di pubblicare.");
  }

  const textContent = typeof textContentRaw === "string" ? textContentRaw.trim() : "";
  const mediaFile = toUploadedFile(mediaFileRaw);

  if (contentTypeRaw === "text" && textContent.length === 0) {
    redirectCreateError("Per un post testuale inserisci un contenuto.");
  }

  if (contentTypeRaw === "image" || contentTypeRaw === "video") {
    if (!mediaFile) {
      redirectCreateError("Per contenuti image/video carica un file media.");
    }

    if (mediaFile.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      redirectCreateError("File troppo grande. Limite massimo 40MB.");
    }

    if (!isCompatibleMediaFile(contentTypeRaw, mediaFile)) {
      redirectCreateError(
        contentTypeRaw === "image"
          ? "Il file selezionato non e un'immagine valida."
          : "Il file selezionato non e un video valido.",
      );
    }
  }

  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  try {
    ({ passions } = await getPassionCatalog(supabase));
  } catch (error) {
    console.error("[create] load passions catalog failed", {
      userId: user.id,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    redirectCreateError("Catalogo passioni non disponibile. Riprova tra poco.");
  }

  if (passions.length === 0) {
    redirectCreateError("Nessuna passione disponibile nel database. Impossibile pubblicare.");
  }

  const allowedPassions = new Set(passions.map((passion) => passion.slug));
  if (!allowedPassions.has(passionSlugRaw)) {
    redirectCreateError("Passione selezionata non valida.");
  }

  const { data: createdPost, error: createPostError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      passion_slug: passionSlugRaw,
      content_type: contentTypeRaw,
      text_content: textContent.length > 0 ? textContent : null,
    })
    .select("id")
    .single();

  if (createPostError || !createdPost) {
    redirectCreateError("Creazione post non riuscita. Verifica migrazioni e policy.");
  }

  if ((contentTypeRaw === "image" || contentTypeRaw === "video") && mediaFile) {
    const mediaStoragePath = buildMediaStoragePath(user.id, createdPost.id, mediaFile.name);
    const { error: mediaUploadError } = await supabase.storage.from(POST_MEDIA_BUCKET).upload(
      mediaStoragePath,
      mediaFile,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: mediaFile.type || undefined,
      },
    );

    if (mediaUploadError) {
      await supabase.from("posts").delete().eq("id", createdPost.id).eq("user_id", user.id);
      redirectCreateError("Upload media non riuscito. Verifica bucket Storage e policy.");
    }

    const {
      data: { publicUrl: mediaPublicUrl },
    } = supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(mediaStoragePath);

    if (!mediaPublicUrl) {
      await supabase.storage.from(POST_MEDIA_BUCKET).remove([mediaStoragePath]);
      await supabase.from("posts").delete().eq("id", createdPost.id).eq("user_id", user.id);
      redirectCreateError("Generazione URL media non riuscita. Post annullato, riprova.");
    }

    const { error: mediaInsertError } = await supabase.from("post_media").insert({
      post_id: createdPost.id,
      media_url: mediaPublicUrl,
      media_kind: contentTypeRaw,
    });

    if (mediaInsertError) {
      await supabase.storage.from(POST_MEDIA_BUCKET).remove([mediaStoragePath]);
      await supabase.from("posts").delete().eq("id", createdPost.id).eq("user_id", user.id);
      redirectCreateError("Salvataggio media non riuscito. Post annullato, riprova.");
    }
  }

  redirect("/feed");
}
