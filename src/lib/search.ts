import type { SupabaseClient } from "@supabase/supabase-js";
import { searchPosts, type FeedPost } from "@/lib/feed";
import { getBlockVisibilitySets } from "@/lib/privacy";
import type { Database } from "@/types/database";

export type SearchUserResult = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isBlockedByMe: boolean;
};

export type SearchPassionResult = {
  slug: string;
  name: string;
};

export type SearchData = {
  term: string;
  users: SearchUserResult[];
  passions: SearchPassionResult[];
  posts: FeedPost[];
};

export function normalizeSearchTerm(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,%]/g, " ")
    .slice(0, 80);
}

export async function searchDiscoveryData(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  rawTerm: string,
): Promise<SearchData> {
  const term = normalizeSearchTerm(rawTerm);
  if (term.length < 2) {
    return { term, users: [], passions: [], posts: [] };
  }

  const ilikePattern = `%${term}%`;
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const blockedByMeIds = new Set(blockVisibility.blockedByMeIds);
  const blockedMeIds = new Set(blockVisibility.blockedMeIds);

  const [usersResponse, passionsResponse, posts] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, display_name, bio, avatar_url")
      .or(`username.ilike.${ilikePattern},display_name.ilike.${ilikePattern}`)
      .order("username", { ascending: true })
      .limit(12),
    supabase
      .from("passions")
      .select("slug, name")
      .or(`slug.ilike.${ilikePattern},name.ilike.${ilikePattern}`)
      .order("name", { ascending: true })
      .limit(12),
    searchPosts(supabase, viewerUserId, term, 16),
  ]);

  if (usersResponse.error) {
    throw usersResponse.error;
  }
  if (passionsResponse.error) {
    throw passionsResponse.error;
  }

  const users: SearchUserResult[] = (usersResponse.data ?? [])
    .filter((row) => !blockedMeIds.has(row.id))
    .map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      isBlockedByMe: blockedByMeIds.has(row.id),
    }));

  const passions: SearchPassionResult[] = passionsResponse.data ?? [];

  return { term, users, passions, posts };
}

