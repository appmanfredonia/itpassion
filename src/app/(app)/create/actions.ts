"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile, getPassionCatalog } from "@/lib/auth";
import {
  buildMediaStoragePath,
  detectPostContentType,
  errorDetailFromUnknown,
  getMediaKindFromFile,
  type PostContentType as ContentType,
  mapStorageUploadErrorToMessage,
  MAX_MEDIA_FILE_SIZE_BYTES,
  POST_MEDIA_BUCKET,
  removePostMediaFromStorage,
} from "@/lib/post-media";
import { createServerSupabaseClient } from "@/lib/supabase";

type ExistingMediaRow = {
  id: string;
  media_url: string;
  media_kind: "image" | "video";
};

export type InlineUpdatePostResult =
  | {
      success: true;
      post: {
        id: string;
        passionSlug: string;
        passionName: string;
        contentType: ContentType;
        textContent: string | null;
        updatedAt: string;
        media: {
          kind: "image" | "video";
          url: string;
        }[];
      };
    }
  | {
      success: false;
      error: string;
    };

function toUploadedFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
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

async function loadAllowedPassions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
) {
  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  try {
    ({ passions } = await getPassionCatalog(supabase));
  } catch (error) {
    console.error("[create] load passions catalog failed", {
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    throw new Error("Catalogo passioni non disponibile. Riprova tra poco.");
  }

  if (passions.length === 0) {
    throw new Error("Nessuna passione disponibile nel database.");
  }

  return passions;
}

function buildUpdatedMediaPayload(
  contentType: ContentType,
  existingMedia: ExistingMediaRow[],
  uploadedMediaPublicUrl: string | null,
): {
  kind: "image" | "video";
  url: string;
}[] {
  if (contentType === "text") {
    return [];
  }

  if (uploadedMediaPublicUrl) {
    return [
      {
        kind: contentType,
        url: uploadedMediaPublicUrl,
      },
    ];
  }

  return existingMedia.map((mediaRow) => ({
    kind: mediaRow.media_kind,
    url: mediaRow.media_url,
  }));
}

export async function updatePostInlineAction(formData: FormData): Promise<InlineUpdatePostResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sessione non valida. Effettua di nuovo l'accesso." };
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch {
    return { success: false, error: "Profilo utente non sincronizzato. Ricarica e riprova." };
  }

  const editingPostIdRaw = formData.get("editingPostId");
  const editingPostId =
    typeof editingPostIdRaw === "string" && editingPostIdRaw.trim().length > 0
      ? editingPostIdRaw.trim()
      : null;

  if (!editingPostId) {
    return { success: false, error: "Post non valido per la modifica." };
  }

  const textContentRaw = formData.get("textContent");
  const mediaFileRaw = formData.get("mediaFile");
  const passionSlugRaw = formData.get("passionSlug");
  const removeMedia = formData.get("removeMedia") === "true";

  if (typeof passionSlugRaw !== "string" || !passionSlugRaw) {
    return { success: false, error: "Compila i campi obbligatori prima di salvare." };
  }

  const textContent = typeof textContentRaw === "string" ? textContentRaw.trim() : "";
  const mediaFile = toUploadedFile(mediaFileRaw);
  const selectedMediaKind = getMediaKindFromFile(mediaFile);

  if (mediaFile) {
    if (mediaFile.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      return { success: false, error: "File troppo grande. Limite massimo 40MB." };
    }

    if (!selectedMediaKind) {
      return { success: false, error: "Il file selezionato non e un media valido." };
    }
  }

  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"];
  try {
    passions = await loadAllowedPassions(supabase);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Catalogo passioni non disponibile.",
    };
  }

  const allowedPassions = new Map(passions.map((passion) => [passion.slug, passion.name]));
  const passionName = allowedPassions.get(passionSlugRaw);
  if (!passionName) {
    return { success: false, error: "Passione selezionata non valida." };
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

  try {
    existingEditTarget = await getOwnedEditablePost(user.id, editingPostId);
  } catch (error) {
    console.error("[create][inline-update] editable post lookup failed", {
      userId: user.id,
      postId: editingPostId,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    return { success: false, error: "Post non disponibile per la modifica." };
  }

  if (!existingEditTarget) {
    return { success: false, error: "Post non trovato o non modificabile." };
  }

  const nextContentType = detectPostContentType({
    textContent,
    selectedMediaKind,
    existingMediaKinds: existingEditTarget.media.map((mediaRow) => mediaRow.media_kind),
    removeExistingMedia: removeMedia,
  });
  const wantsMedia = nextContentType !== "text";

  if (nextContentType === "text" && textContent.length === 0) {
    return {
      success: false,
      error: "Aggiungi un testo o carica un media prima di salvare il post.",
    };
  }

  let uploadedMedia:
    | {
        supabase: typeof supabase;
        mediaStoragePath: string;
        mediaPublicUrl: string;
      }
    | null = null;

  try {
    if (selectedMediaKind && mediaFile) {
      uploadedMedia = await uploadReplacementMedia(user.id, editingPostId, mediaFile);
    }
  } catch (error) {
    console.error("[create][inline-update] media upload failed", {
      userId: user.id,
      postId: editingPostId,
      bucket: POST_MEDIA_BUCKET,
      fileName: mediaFile?.name,
      fileType: mediaFile?.type,
      fileSize: mediaFile?.size,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });

    return {
      success: false,
      error: mapStorageUploadErrorToMessage(error),
    };
  }

  const nextUpdatedAt = new Date().toISOString();
  const { error: updatePostError } = await supabase
    .from("posts")
    .update({
      passion_slug: passionSlugRaw,
      content_type: nextContentType,
      text_content: textContent.length > 0 ? textContent : null,
      updated_at: nextUpdatedAt,
    })
    .eq("id", editingPostId)
    .eq("user_id", user.id);

  if (updatePostError) {
    if (uploadedMedia) {
      await uploadedMedia.supabase.storage
        .from(POST_MEDIA_BUCKET)
        .remove([uploadedMedia.mediaStoragePath]);
    }

    return { success: false, error: "Salvataggio post non riuscito. Riprova." };
  }

  if (!wantsMedia) {
    if (existingEditTarget.media.length > 0) {
      const { error: deleteMediaRowsError } = await supabase
        .from("post_media")
        .delete()
        .eq("post_id", editingPostId);

      if (deleteMediaRowsError) {
        return { success: false, error: "Aggiornamento media non riuscito. Riprova." };
      }

      try {
        await removePostMediaFromStorage(
          supabase,
          existingEditTarget.media.map((mediaRow) => mediaRow.media_url),
        );
      } catch (error) {
        console.error("[create][inline-update] remove media after text switch failed", {
          userId: user.id,
          postId: editingPostId,
          detail: errorDetailFromUnknown(error),
          rawError: error,
        });
      }
    }
  } else if (uploadedMedia) {
    const { data: insertedMediaRow, error: insertMediaError } = await supabase
      .from("post_media")
      .insert({
        post_id: editingPostId,
        media_url: uploadedMedia.mediaPublicUrl,
        media_kind: nextContentType,
      })
      .select("id")
      .single();

    if (insertMediaError || !insertedMediaRow) {
      await uploadedMedia.supabase.storage
        .from(POST_MEDIA_BUCKET)
        .remove([uploadedMedia.mediaStoragePath]);
      return { success: false, error: "Salvataggio media non riuscito. Riprova." };
    }

    if (existingEditTarget.media.length > 0) {
      await supabase
        .from("post_media")
        .delete()
        .eq("post_id", editingPostId)
        .neq("id", insertedMediaRow.id);

      try {
        await removePostMediaFromStorage(
          supabase,
          existingEditTarget.media.map((mediaRow) => mediaRow.media_url),
        );
      } catch (error) {
        console.error("[create][inline-update] remove replaced media failed", {
          userId: user.id,
          postId: editingPostId,
          detail: errorDetailFromUnknown(error),
          rawError: error,
        });
      }
    }
  }

  revalidatePath("/feed");
  revalidatePath("/explore");
  revalidatePath("/search");
  revalidatePath("/saved");
  revalidatePath("/profile");

  return {
    success: true,
    post: {
      id: editingPostId,
      passionSlug: passionSlugRaw,
      passionName,
      contentType: nextContentType,
      textContent: textContent.length > 0 ? textContent : null,
      updatedAt: nextUpdatedAt,
      media: buildUpdatedMediaPayload(
        nextContentType,
        existingEditTarget.media,
        uploadedMedia?.mediaPublicUrl ?? null,
      ),
    },
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
  const textContentRaw = formData.get("textContent");
  const mediaFileRaw = formData.get("mediaFile");
  const passionSlugRaw = formData.get("passionSlug");
  const removeMedia = formData.get("removeMedia") === "true";

  if (typeof passionSlugRaw !== "string" || !passionSlugRaw) {
    redirectCreateError("Compila i campi obbligatori prima di pubblicare.", editingPostId);
  }

  const textContent = typeof textContentRaw === "string" ? textContentRaw.trim() : "";
  const mediaFile = toUploadedFile(mediaFileRaw);
  const selectedMediaKind = getMediaKindFromFile(mediaFile);

  if (mediaFile) {
    if (mediaFile.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      redirectCreateError("File troppo grande. Limite massimo 40MB.", editingPostId);
    }

    if (!selectedMediaKind) {
      redirectCreateError("Il file selezionato non e un media valido.", editingPostId);
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
  }

  const inferredContentType = detectPostContentType({
    textContent,
    selectedMediaKind,
    existingMediaKinds: existingEditTarget?.media.map((mediaRow) => mediaRow.media_kind),
    removeExistingMedia: removeMedia,
  });
  const wantsMedia = inferredContentType !== "text";

  if (inferredContentType === "text" && textContent.length === 0) {
    redirectCreateError("Aggiungi un testo o carica un media prima di pubblicare.", editingPostId);
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
          content_type: inferredContentType,
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
    if (selectedMediaKind && mediaFile && postId) {
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
          content_type: inferredContentType,
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
          media_kind: inferredContentType,
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
      media_kind: inferredContentType,
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
