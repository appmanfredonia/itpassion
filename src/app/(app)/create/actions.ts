"use server";

import { redirect } from "next/navigation";
import { ensureUserProfile, getPassionCatalog } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type ContentType = "text" | "image" | "video";

function isValidContentType(value: string): value is ContentType {
  return value === "text" || value === "image" || value === "video";
}

function redirectCreateError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/create?${params.toString()}`);
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
  const mediaUrlRaw = formData.get("mediaUrl");
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
  const mediaUrl = typeof mediaUrlRaw === "string" ? mediaUrlRaw.trim() : "";

  if (contentTypeRaw === "text" && textContent.length === 0) {
    redirectCreateError("Per un post testuale inserisci un contenuto.");
  }

  if ((contentTypeRaw === "image" || contentTypeRaw === "video") && mediaUrl.length === 0) {
    redirectCreateError("Per contenuti image/video inserisci un URL media valido.");
  }

  const { passions } = await getPassionCatalog(supabase);
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

  if ((contentTypeRaw === "image" || contentTypeRaw === "video") && mediaUrl.length > 0) {
    const { error: mediaInsertError } = await supabase.from("post_media").insert({
      post_id: createdPost.id,
      media_url: mediaUrl,
      media_kind: contentTypeRaw,
    });

    if (mediaInsertError) {
      await supabase.from("posts").delete().eq("id", createdPost.id).eq("user_id", user.id);
      redirectCreateError("Salvataggio media non riuscito. Post annullato, riprova.");
    }
  }

  redirect("/feed");
}
