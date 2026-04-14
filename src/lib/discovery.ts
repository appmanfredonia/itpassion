import type { SupabaseClient } from "@supabase/supabase-js";
import { getRecentPosts, getRecentPostsByPassion, type FeedPost } from "@/lib/feed";
import {
  getBlockVisibilitySets,
  getHiddenPrivateProfileIds,
  toSupabaseInFilter,
} from "@/lib/privacy";
import type { Database } from "@/types/database";

export type ExplorePassion = {
  slug: string;
  name: string;
  recentPostsCount: number;
};

export type ExploreAuthor = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  postsCountInView: number;
};

export type ExploreData = {
  passions: ExplorePassion[];
  selectedPassionSlug: string | null;
  selectedPassionName: string | null;
  posts: FeedPost[];
  authors: ExploreAuthor[];
};

export async function getExploreData(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  selectedPassionSlugRaw: string | undefined,
): Promise<ExploreData> {
  const [blockVisibility, hiddenPrivateProfileIds] = await Promise.all([
    getBlockVisibilitySets(supabase, viewerUserId),
    getHiddenPrivateProfileIds(supabase, viewerUserId),
  ]);
  const hiddenUserIds = new Set(
    [
      ...blockVisibility.blockedByMeIds,
      ...blockVisibility.blockedMeIds,
      ...hiddenPrivateProfileIds,
    ],
  );
  const hiddenUserIdsList = Array.from(hiddenUserIds);

  const { data: passionsRows, error: passionsError } = await supabase
    .from("passions")
    .select("slug, name")
    .order("name");

  if (passionsError) {
    throw passionsError;
  }

  const passionCatalog = passionsRows ?? [];
  const selectedPassionSlug =
    selectedPassionSlugRaw &&
    passionCatalog.some((passion) => passion.slug === selectedPassionSlugRaw)
      ? selectedPassionSlugRaw
      : null;

  const posts = selectedPassionSlug
    ? await getRecentPostsByPassion(supabase, viewerUserId, selectedPassionSlug, 24)
    : await getRecentPosts(supabase, viewerUserId, 24);

  let recentPassionsQuery = supabase
    .from("posts")
    .select("passion_slug, user_id")
    .order("created_at", { ascending: false })
    .limit(300);

  if (hiddenUserIdsList.length > 0) {
    recentPassionsQuery = recentPassionsQuery.not(
      "user_id",
      "in",
      toSupabaseInFilter(hiddenUserIdsList),
    );
  }

  const { data: recentPassionRows, error: recentPassionError } = await recentPassionsQuery;

  if (recentPassionError) {
    throw recentPassionError;
  }

  const countsByPassion = new Map<string, number>();
  (recentPassionRows ?? []).forEach((row) => {
    if (hiddenUserIds.has(row.user_id)) {
      return;
    }

    countsByPassion.set(
      row.passion_slug,
      (countsByPassion.get(row.passion_slug) ?? 0) + 1,
    );
  });

  const passions: ExplorePassion[] = passionCatalog.map((passion) => ({
    slug: passion.slug,
    name: passion.name,
    recentPostsCount: countsByPassion.get(passion.slug) ?? 0,
  }));

  const authorsById = new Map<string, ExploreAuthor>();
  posts.forEach((post) => {
    const existing = authorsById.get(post.userId);
    if (existing) {
      existing.postsCountInView += 1;
      return;
    }

    authorsById.set(post.userId, {
      userId: post.userId,
      username: post.authorUsername,
      displayName: post.authorDisplayName,
      avatarUrl: post.authorAvatarUrl,
      postsCountInView: 1,
    });
  });

  const authors = Array.from(authorsById.values()).sort(
    (a, b) => b.postsCountInView - a.postsCountInView,
  );

  const selectedPassionName = selectedPassionSlug
    ? passionCatalog.find((passion) => passion.slug === selectedPassionSlug)?.name ?? null
    : null;

  return {
    passions,
    selectedPassionSlug,
    selectedPassionName,
    posts,
    authors,
  };
}

export function normalizePassionFilter(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

