"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
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

function revalidateSocialPaths(returnPath: string) {
  const pathname = getPathname(returnPath);
  const paths = new Set(["/feed", "/saved", "/profile", pathname]);
  paths.forEach((path) => revalidatePath(path));
}

function redirectWithCommentError(returnPath: string, message: string): never {
  const url = new URL(returnPath, "http://localhost");
  url.searchParams.set("commentError", message);
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

  await ensureUserProfile(supabase, user);
  return { supabase, user };
}

export async function toggleLikeAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof postId !== "string" || postId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user } = await getActionContext();

  const { data: existingLikes, error: existingLikesError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingLikesError) {
    revalidateSocialPaths(returnPath);
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

  revalidateSocialPaths(returnPath);
}

export async function toggleSavePostAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof postId !== "string" || postId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user } = await getActionContext();

  const { data: existingSavedRows, error: existingSavedError } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingSavedError) {
    revalidateSocialPaths(returnPath);
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

  revalidateSocialPaths(returnPath);
}

export async function addCommentAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));
  const contentRaw = formData.get("commentContent");

  if (typeof postId !== "string" || postId.length === 0) {
    redirectWithCommentError(returnPath, "Post non valido.");
  }

  if (typeof contentRaw !== "string") {
    redirectWithCommentError(returnPath, "Commento non valido.");
  }

  const content = contentRaw.trim();
  if (content.length === 0) {
    redirectWithCommentError(returnPath, "Scrivi un commento prima di inviare.");
  }
  if (content.length > 500) {
    redirectWithCommentError(returnPath, "Commento troppo lungo (max 500 caratteri).");
  }

  const { supabase, user } = await getActionContext();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
  });

  if (error) {
    redirectWithCommentError(returnPath, "Salvataggio commento non riuscito.");
  }

  revalidateSocialPaths(returnPath);
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const commentId = formData.get("commentId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof commentId !== "string" || commentId.length === 0) {
    revalidateSocialPaths(returnPath);
    return;
  }

  const { supabase, user } = await getActionContext();
  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidateSocialPaths(returnPath);
}
