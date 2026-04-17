"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile, getPassionCatalog } from "@/lib/auth";
import {
  buildMediaStoragePath,
  errorDetailFromUnknown,
  mapStorageUploadErrorToMessage,
  MAX_MEDIA_FILE_SIZE_BYTES,
  POST_MEDIA_BUCKET,
  removePostMediaFromStorage,
} from "@/lib/post-media";
import { createServerSupabaseClient } from "@/lib/supabase";

type ContentType = "text" | "image" | "video";

type ExistingMediaRow = {
  id: string;
  media_url: string;
  media_kind: "image" | "video";
};

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

function redirectCreateError(message: string, editingPostId?: string | null): never {
  const params = new URLSearchParams({ error: message });
  if (editingPostId) {
    params.set("edit", editingPostId);
  }
  redirect(`/create?${params.toString()}`);
}

async function getOwnedEditablePost(
  userId: string,
  postId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data: postRow, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (postError) {
    throw postError;
  }

  if (!postRow) {
    return null;
  }

  const { data: mediaRows, error: mediaError } = await supabase
    .from("post_media")
    .select("id, media_url, media_kind")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (mediaError) {
    throw mediaError;
  }

  return {
    post: postRow,
    media: (mediaRows ?? []) as ExistingMediaRow[],
  };
}

async function uploadReplacementMedia(
  userId: string,
  postId: string,
  mediaFile: File,
) {
  const supabase = await createServerSupabaseClient();
  const mediaStoragePath = buildMediaStoragePath(userId, postId, mediaFile.name);
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
    throw mediaUploadError;
  }

  const {
    data: { publicUrl: mediaPublicUrl },
  } = supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(mediaStoragePath);

  if (!mediaPublicUrl) {
    await supabase.storage.from(POST_MEDIA_BUCKET).remove([mediaStoragePath]);
    throw new Error("Generazione URL media non riuscita.");
  }

  return {
    supabase,
    mediaStoragePath,
    mediaPublicUrl,
  };
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

  const editingPostIdRaw = formData.get("editingPostId");
  const editingPostId =
    typeof editingPostIdRaw === "string" && editingPostIdRaw.trim().length > 0
      ? editingPostIdRaw.trim()
      : null;
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
    redirectCreateError("Compila i campi obbligatori prima di pubblicare.", editingPostId);
  }

  const textContent = typeof textContentRaw === "string" ? textContentRaw.trim() : "";
  const mediaFile = toUploadedFile(mediaFileRaw);
  const wantsMedia = contentTypeRaw === "image" || contentTypeRaw === "video";

  if (contentTypeRaw === "text" && textContent.length === 0) {
    redirectCreateError("Per un post testuale inserisci un contenuto.", editingPostId);
  }

  if (mediaFile) {
    if (mediaFile.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      redirectCreateError("File troppo grande. Limite massimo 40MB.", editingPostId);
    }

    if (!isCompatibleMediaFile(contentTypeRaw, mediaFile)) {
      redirectCreateError(
        contentTypeRaw === "image"
          ? "Il file selezionato non e un'immagine valida."
          : "Il file selezionato non e un video valido.",
        editingPostId,
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
    redirectCreateError("Catalogo passioni non disponibile. Riprova tra poco.", editingPostId);
  }

  if (passions.length === 0) {
    redirectCreateError("Nessuna passione disponibile nel database. Impossibile pubblicare.", editingPostId);
  }

  const allowedPassions = new Set(passions.map((passion) => passion.slug));
  if (!allowedPassions.has(passionSlugRaw)) {
    redirectCreateError("Passione selezionata non valida.", editingPostId);
  }

  let existingEditTarget:
    | {
        post: {
          id: string;
          user_id: string;
          passion_slug: string;
          content_type: string;
          text_content: string | null;
        };
        media: ExistingMediaRow[];
      }
    | null = null;

  if (editingPostId) {
    try {
      existingEditTarget = await getOwnedEditablePost(user.id, editingPostId);
    } catch (error) {
      console.error("[create] editable post lookup failed", {
        userId: user.id,
        postId: editingPostId,
        detail: errorDetailFromUnknown(error),
        rawError: error,
      });
      redirectCreateError("Post non disponibile per la modifica.", editingPostId);
    }

    if (!existingEditTarget) {
      redirectCreateError("Post non trovato o non modificabile.", editingPostId);
    }

    if (wantsMedia && !mediaFile) {
      const existingMedia = existingEditTarget.media;
      if (existingMedia.length === 0) {
        redirectCreateError("Carica un file media per questo contenuto.", editingPostId);
      }

      const hasDifferentMediaKind = existingMedia.some(
        (mediaRow) => mediaRow.media_kind !== contentTypeRaw,
      );
      if (hasDifferentMediaKind) {
        redirectCreateError(
          "Carica un nuovo file per passare da foto a video o viceversa.",
          editingPostId,
        );
      }
    }
  } else if (wantsMedia && !mediaFile) {
    redirectCreateError("Per contenuti foto o video carica un file media.", null);
  }

  let postId = editingPostId;
  let uploadedMedia:
    | {
        supabase: typeof supabase;
        mediaStoragePath: string;
        mediaPublicUrl: string;
      }
    | null = null;

  if (!postId) {
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
      redirectCreateError("Creazione post non riuscita. Verifica migrazioni e policy.", null);
    }

    postId = createdPost.id;
  }

  try {
    if (wantsMedia && mediaFile && postId) {
      uploadedMedia = await uploadReplacementMedia(user.id, postId, mediaFile);
    }
  } catch (error) {
    console.error("[create] media upload failed", {
      userId: user.id,
      postId,
      bucket: POST_MEDIA_BUCKET,
      fileName: mediaFile?.name,
      fileType: mediaFile?.type,
      fileSize: mediaFile?.size,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });

    if (!editingPostId && postId) {
      await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
    }

    redirectCreateError(mapStorageUploadErrorToMessage(error), editingPostId);
  }

  const { error: upsertPostError } = editingPostId
    ? await supabase
        .from("posts")
        .update({
          passion_slug: passionSlugRaw,
          content_type: contentTypeRaw,
          text_content: textContent.length > 0 ? textContent : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", user.id)
    : { error: null };

  if (upsertPostError) {
    if (uploadedMedia) {
      await uploadedMedia.supabase.storage
        .from(POST_MEDIA_BUCKET)
        .remove([uploadedMedia.mediaStoragePath]);
    }

    redirectCreateError("Salvataggio post non riuscito. Riprova.", editingPostId);
  }

  if (editingPostId && existingEditTarget && postId) {
    const existingMediaUrls = existingEditTarget.media.map((mediaRow) => mediaRow.media_url);

    if (!wantsMedia) {
      if (existingEditTarget.media.length > 0) {
        const { error: deleteMediaRowsError } = await supabase
          .from("post_media")
          .delete()
          .eq("post_id", postId);

        if (deleteMediaRowsError) {
          redirectCreateError("Aggiornamento media non riuscito. Riprova.", editingPostId);
        }

        try {
          await removePostMediaFromStorage(supabase, existingMediaUrls);
        } catch (error) {
          console.error("[create] remove old media after text switch failed", {
            userId: user.id,
            postId,
            detail: errorDetailFromUnknown(error),
            rawError: error,
          });
        }
      }
    } else if (uploadedMedia) {
      const { data: insertedMediaRow, error: insertMediaError } = await supabase
        .from("post_media")
        .insert({
          post_id: postId,
          media_url: uploadedMedia.mediaPublicUrl,
          media_kind: contentTypeRaw,
        })
        .select("id")
        .single();

      if (insertMediaError || !insertedMediaRow) {
        await uploadedMedia.supabase.storage
          .from(POST_MEDIA_BUCKET)
          .remove([uploadedMedia.mediaStoragePath]);
        redirectCreateError("Salvataggio media non riuscito. Riprova.", editingPostId);
      }

      if (existingEditTarget.media.length > 0) {
        await supabase
          .from("post_media")
          .delete()
          .eq("post_id", postId)
          .neq("id", insertedMediaRow.id);

        try {
          await removePostMediaFromStorage(supabase, existingMediaUrls);
        } catch (error) {
          console.error("[create] remove replaced media failed", {
            userId: user.id,
            postId,
            detail: errorDetailFromUnknown(error),
            rawError: error,
          });
        }
      }
    }
  } else if (!editingPostId && wantsMedia && uploadedMedia && postId) {
    const { error: mediaInsertError } = await supabase.from("post_media").insert({
      post_id: postId,
      media_url: uploadedMedia.mediaPublicUrl,
      media_kind: contentTypeRaw,
    });

    if (mediaInsertError) {
      await uploadedMedia.supabase.storage
        .from(POST_MEDIA_BUCKET)
        .remove([uploadedMedia.mediaStoragePath]);
      await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
      redirectCreateError("Salvataggio media non riuscito. Post annullato, riprova.", null);
    }
  }

  redirect(`/feed?post=${postId}`);
}
