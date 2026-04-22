import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/auth";
import { normalizeProvinceMatchKey } from "@/lib/location";
import {
  getRitualColorTheme,
  getViewerLocalTribes,
  type ViewerLocalTribe,
} from "@/lib/rituals";
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

export type ProfileLocalTribe = ViewerLocalTribe;

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

function buildTribeLabel(passionName: string, province: string): string {
  return `Tribu ${passionName} - ${province}`;
}

export function deriveLocalTribesFromProfile(
  profile: Pick<AppProfile, "province">,
  passions: ProfilePassion[],
): ProfileLocalTribe[] {
  const province = profile.province?.trim() ?? "";
  const provinceKey = normalizeProvinceMatchKey(province);

  if (!province || !provinceKey || passions.length === 0) {
    return [];
  }

  return passions
    .map((passion) => ({
      id: `derived:${provinceKey}:${passion.slug}`,
      passionSlug: passion.slug,
      passionName: passion.name,
      province,
      provinceKey,
      label: buildTribeLabel(passion.name, province),
      color: getRitualColorTheme(passion.slug),
    }))
    .sort((firstTribe, secondTribe) =>
      firstTribe.label.localeCompare(secondTribe.label, "it"),
    );
}

export async function getProfileLocalTribes(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  profile: AppProfile,
  passions: ProfilePassion[],
): Promise<ProfileLocalTribe[]> {
  const derivedTribes = deriveLocalTribesFromProfile(profile, passions);

  if (profile.id !== viewerUserId) {
    return derivedTribes;
  }

  try {
    const { tribes } = await getViewerLocalTribes(supabase, viewerUserId);
    return tribes.length > 0 ? tribes : derivedTribes;
  } catch {
    return derivedTribes;
  }
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
  localTribes: ProfileLocalTribe[];
};

export async function getProfilePageData(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  profile: AppProfile,
): Promise<ProfilePageData> {
  const [counters, passions] = await Promise.all([
    getProfileCounters(supabase, profile.id),
    getProfilePassions(supabase, profile.id),
  ]);

  const localTribes = await getProfileLocalTribes(
    supabase,
    viewerUserId,
    profile,
    passions,
  );

  return { profile, counters, passions, localTribes };
}
