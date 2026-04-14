"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

const DEFAULT_RETURN_PATH = "/profile";

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

function revalidateProfilePaths(returnPath: string) {
  const pathname = getPathname(returnPath);
  const paths = new Set(["/feed", "/profile", pathname]);
  paths.forEach((path) => revalidatePath(path));
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

export async function toggleFollowAction(formData: FormData): Promise<void> {
  const targetUserId = formData.get("targetUserId");
  const returnPath = getSafeReturnPath(formData.get("returnPath"));

  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    revalidateProfilePaths(returnPath);
    return;
  }

  const { supabase, user } = await getActionContext();
  if (user.id === targetUserId) {
    revalidateProfilePaths(returnPath);
    return;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .limit(1);

  if (existingError) {
    revalidateProfilePaths(returnPath);
    return;
  }

  if ((existingRows ?? []).length > 0) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
  } else {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
  }

  revalidateProfilePaths(returnPath);
}
