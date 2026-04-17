"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
import { removePostMediaFromStorage } from "@/lib/post-media";
import { createServerSupabaseClient } from "@/lib/supabase";

const DEFAULT_RETURN_PATH = "/feed";

function getSafeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return DEFAULT_RETURN_PATH;
  }

  return value;
}

function getPathname(path: string): string {
  const [pathname] = path.split("?");
  return pathname || DEFAULT_RETURN_PATH;
}

function revalidateSocialPaths(returnPath: string, profileUsername?: string | null) {
  const pathname = getPathname(returnPath);
  const paths = new Set(["/feed", "/saved", "/profile", "/explore", "/create", pathname]);

  if (profileUsername) {
    paths.add(`/profile/${profileUsername}`);
  }

  paths.forEach((path) => revalidatePath(path));
}

function redirectWithMessage(
  returnPath: string,
  key: "commentError" | "postError",
  message: string,
): never {
  const url = new URL(returnPath, "http://localhost");
  url.searchParams.set(key, message);
  redirect(`${url.pathname}${url.search}`);
}

function cleanPostReturnPath(returnPath: string, postId: string): never {
  const url = new URL(returnPath, "http://localhost");
  if (url.searchParams.get("post") === postId) {
    url.searchParams.delete("post");
  }
  url.searchParams.delete("editComment");
  redirect(`${url.pathname}${url.search}`);
}

async function getActionContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureUserProfile(supabase, user);
  return { supabase, user, profile };
}

export async function toggleLikeAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof postId !== "string" || postId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user, profile } = await getActionContext();

  const { data: existingLikes, error: existingLikesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingLikesError) {
    revalidateSocialPaths(returnPath, profile?.username);
    return;
  }

  if ((existingLikes ?? []).length > 0) {
    await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  revalidateSocialPaths(returnPath, profile?.username);
}

export async function toggleSavePostAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof postId !== "string" || postId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user, profile } = await getActionContext();

  const { data: existingSavedRows, error: existingSavedError } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingSavedError) {
    revalidateSocialPaths(returnPath, profile?.username);
    return;
  }

  if ((existingSavedRows ?? []).length > 0) {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("saved_posts").insert({
      post_id: postId,
      user_id: user.id,
    });
  }

  revalidateSocialPaths(returnPath, profile?.username);
}

export async function addCommentAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));
  const contentRaw = formData.get("commentContent");

  if (typeof postId !== "string" || postId.length === 0) {
    redirectWithMessage(returnPath, "commentError", "Post non valido.");
  }

  if (typeof contentRaw !== "string") {
    redirectWithMessage(returnPath, "commentError", "Commento non valido.");
  }

  const content = contentRaw.trim();
  if (content.length === 0) {
    redirectWithMessage(returnPath, "commentError", "Scrivi un commento prima di inviare.");
  }
  if (content.length > 500) {
    redirectWithMessage(returnPath, "commentError", "Commento troppo lungo (max 500 caratteri).");
  }

  const { supabase, user, profile } = await getActionContext();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
  });

  if (error) {
    redirectWithMessage(returnPath, "commentError", "Salvataggio commento non riuscito.");
  }

  revalidateSocialPaths(returnPath, profile?.username);
}

export async function updateCommentAction(formData: FormData): Promise<void> {
  const commentId = formData.get("commentId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));
  const contentRaw = formData.get("commentContent");

  if (typeof commentId !== "string" || commentId.length === 0) {
    redirectWithMessage(returnPath, "commentError", "Commento non valido.");
  }

  if (typeof contentRaw !== "string") {
    redirectWithMessage(returnPath, "commentError", "Testo commento non valido.");
  }

  const content = contentRaw.trim();
  if (content.length === 0) {
    redirectWithMessage(returnPath, "commentError", "Scrivi un commento prima di salvare.");
  }
  if (content.length > 500) {
    redirectWithMessage(returnPath, "commentError", "Commento troppo lungo (max 500 caratteri).");
  }

  const { supabase, user, profile } = await getActionContext();
  const { error } = await supabase
    .from("comments")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithMessage(returnPath, "commentError", "Modifica commento non riuscita.");
  }

  revalidateSocialPaths(returnPath, profile?.username);
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const commentId = formData.get("commentId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof commentId !== "string" || commentId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user, profile } = await getActionContext();
  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidateSocialPaths(returnPath, profile?.username);
}

export async function deletePostAction(formData: FormData): Promise<never> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof postId !== "string" || postId.length === 0) {
    redirectWithMessage(returnPath, "postError", "Post non valido.");
  }

  const { supabase, user, profile } = await getActionContext();
  const { data: mediaRows, error: mediaRowsError } = await supabase
    .from("post_media")
    .select("media_url")
    .eq("post_id", postId);

  if (mediaRowsError) {
    redirectWithMessage(returnPath, "postError", "Media del post non disponibili.");
  }

  const { error: deletePostError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (deletePostError) {
    redirectWithMessage(returnPath, "postError", "Eliminazione post non riuscita.");
  }

  try {
    await removePostMediaFromStorage(
      supabase,
      (mediaRows ?? []).map((mediaRow) => mediaRow.media_url),
    );
  } catch (error) {
    console.error("[feed][deletePostAction] media storage cleanup failed", error);
  }

  revalidateSocialPaths(returnPath, profile?.username);
  cleanPostReturnPath(returnPath, postId);
}
