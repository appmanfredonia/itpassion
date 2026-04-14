import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/auth";
import type { Database } from "@/types/database";

export type ProfileCounter = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type ProfilePassion = {
  slug: string;
  name: string;
};

function countValue(count: number | null): number {
  return count ?? 0;
}

export async function getProfileCounters(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileCounter> {
  const [{ count: postsCount }, { count: followersCount }, { count: followingCount }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

  return {
    postsCount: countValue(postsCount),
    followersCount: countValue(followersCount),
    followingCount: countValue(followingCount),
  };
}

export async function getProfilePassions(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfilePassion[]> {
  const { data: userPassionsRows, error: userPassionsError } = await supabase
    .from("user_passions")
    .select("passion_slug")
    .eq("user_id", userId);

  if (userPassionsError) {
    throw userPassionsError;
  }

  const passionSlugs = Array.from(
    new Set((userPassionsRows ?? []).map((row) => row.passion_slug)),
  );

  if (passionSlugs.length === 0) {
    return [];
  }

  const { data: passionsRows, error: passionsError } = await supabase
    .from("passions")
    .select("slug, name")
    .in("slug", passionSlugs);

  if (passionsError) {
    throw passionsError;
  }

  const bySlug = new Map((passionsRows ?? []).map((row) => [row.slug, row.name]));
  return passionSlugs.map((slug) => ({
    slug,
    name: bySlug.get(slug) ?? slug,
  }));
}

export async function isFollowingProfile(
  supabase: SupabaseClient<Database>,
  followerUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", followerUserId)
    .eq("following_id", targetUserId)
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

export type ProfilePageData = {
  profile: AppProfile;
  counters: ProfileCounter;
  passions: ProfilePassion[];
};

export async function getProfilePageData(
  supabase: SupabaseClient<Database>,
  profile: AppProfile,
): Promise<ProfilePageData> {
  const [counters, passions] = await Promise.all([
    getProfileCounters(supabase, profile.id),
    getProfilePassions(supabase, profile.id),
  ]);

  return { profile, counters, passions };
}
