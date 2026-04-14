import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getBlockVisibilitySets } from "@/lib/privacy";
import type { Database } from "@/types/database";

export type FeedTab = "per-te" | "seguiti";

export type FeedComment = {
  id: string;
  userId: string;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
};

export type FeedPost = {
  id: string;
  userId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  authorBio: string | null;
  passionSlug: string;
  passionName: string;
  contentType: "text" | "image" | "video";
  textContent: string | null;
  createdAt: string;
  media: {
    kind: "image" | "video";
    url: string;
  }[];
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  comments: FeedComment[];
  savedByMe: boolean;
};

export type FeedQueryResult = {
  posts: FeedPost[];
  warning: string | null;
};

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

function normalizeContentType(value: string): "text" | "image" | "video" {
  if (value === "image" || value === "video") {
    return value;
  }

  return "text";
}

function toProfileMap(users: UserRow[]): Map<string, UserRow> {
  return new Map(users.map((row) => [row.id, row]));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function fallbackUsername(userId: string): string {
  return `utente_${userId.replace(/-/g, "").slice(0, 8)}`;
}

function sortDescByDate(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

function normalizeSearchTerm(rawTerm: string): string {
  return rawTerm
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,%]/g, " ")
    .slice(0, 80);
}

function createHiddenUserSet(
  blockedByMeIds: string[],
  blockedMeIds: string[],
): Set<string> {
  return new Set([...blockedByMeIds, ...blockedMeIds]);
}

function excludeBlockedPostRows(
  postRows: PostRow[],
  blockedUserIds: Set<string>,
): PostRow[] {
  if (blockedUserIds.size === 0) {
    return postRows;
  }

  return postRows.filter((row) => !blockedUserIds.has(row.user_id));
}

async function fetchUsersByIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<UserRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, bio, avatar_url, created_at, updated_at")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function hydratePosts(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  postRows: PostRow[],
  blockedUserIds: Set<string> = new Set(),
): Promise<FeedPost[]> {
  if (postRows.length === 0) {
    return [];
  }

  const postIds = postRows.map((row) => row.id);
  const authorIds = unique(postRows.map((row) => row.user_id));
  const passionSlugs = unique(postRows.map((row) => row.passion_slug));

  const [
    { data: mediaRows, error: mediaError },
    { data: passionsRows, error: passionsError },
    { data: likesRows, error: likesError },
    { data: commentsRows, error: commentsError },
    { data: savedRows, error: savedError },
  ] = await Promise.all([
    supabase
      .from("post_media")
      .select("post_id, media_url, media_kind")
      .in("post_id", postIds),
    supabase
      .from("passions")
      .select("slug, name")
      .in("slug", passionSlugs),
    supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds),
    supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", viewerUserId)
      .in("post_id", postIds),
  ]);

  if (mediaError) {
    throw mediaError;
  }
  if (passionsError) {
    throw passionsError;
  }
  if (likesError) {
    throw likesError;
  }
  if (commentsError) {
    throw commentsError;
  }
  if (savedError) {
    throw savedError;
  }

  const commentRowsTyped: CommentRow[] = (commentsRows ?? []).filter(
    (row) => !blockedUserIds.has(row.user_id),
  );
  const commentAuthorIds = unique(commentRowsTyped.map((row) => row.user_id));
  const usersRows = await fetchUsersByIds(supabase, unique([...authorIds, ...commentAuthorIds]));
  const userById = toProfileMap(usersRows);

  const mediaByPostId = new Map<string, FeedPost["media"]>();
  (mediaRows ?? []).forEach((row) => {
    const current = mediaByPostId.get(row.post_id) ?? [];
    current.push({
      kind: row.media_kind,
      url: row.media_url,
    });
    mediaByPostId.set(row.post_id, current);
  });

  const passionNameBySlug = new Map((passionsRows ?? []).map((row) => [row.slug, row.name]));

  const likesCountByPostId = new Map<string, number>();
  const likedByMeSet = new Set<string>();
  (likesRows ?? []).forEach((row) => {
    likesCountByPostId.set(row.post_id, (likesCountByPostId.get(row.post_id) ?? 0) + 1);
    if (row.user_id === viewerUserId) {
      likedByMeSet.add(row.post_id);
    }
  });

  const commentsByPostId = new Map<string, FeedComment[]>();
  commentRowsTyped.forEach((row) => {
    const author = userById.get(row.user_id);
    const current = commentsByPostId.get(row.post_id) ?? [];

    current.push({
      id: row.id,
      userId: row.user_id,
      authorUsername: author?.username ?? fallbackUsername(row.user_id),
      authorDisplayName: author?.display_name ?? `@${fallbackUsername(row.user_id)}`,
      content: row.content,
      createdAt: row.created_at,
      canDelete: row.user_id === viewerUserId,
    });

    commentsByPostId.set(row.post_id, current);
  });

  const savedPostSet = new Set((savedRows ?? []).map((row) => row.post_id));

  return postRows.map((row) => {
    const author = userById.get(row.user_id);
    const comments = commentsByPostId.get(row.id) ?? [];
    return {
      id: row.id,
      userId: row.user_id,
      authorUsername: author?.username ?? fallbackUsername(row.user_id),
      authorDisplayName: author?.display_name ?? `@${fallbackUsername(row.user_id)}`,
      authorAvatarUrl: author?.avatar_url ?? null,
      authorBio: author?.bio ?? null,
      passionSlug: row.passion_slug,
      passionName: passionNameBySlug.get(row.passion_slug) ?? row.passion_slug,
      contentType: normalizeContentType(row.content_type),
      textContent: row.text_content,
      createdAt: row.created_at,
      media: mediaByPostId.get(row.id) ?? [],
      likesCount: likesCountByPostId.get(row.id) ?? 0,
      likedByMe: likedByMeSet.has(row.id),
      commentsCount: comments.length,
      comments,
      savedByMe: savedPostSet.has(row.id),
    };
  });
}

function dedupePostsById(posts: FeedPost[]): FeedPost[] {
  const byId = new Map<string, FeedPost>();
  posts.forEach((post) => {
    byId.set(post.id, post);
  });

  return Array.from(byId.values()).sort((a, b) => sortDescByDate(a.createdAt, b.createdAt));
}

export async function getFeedPosts(
  supabase: SupabaseClient<Database>,
  user: User,
  tab: FeedTab,
): Promise<FeedQueryResult> {
  const blockVisibility = await getBlockVisibilitySets(supabase, user.id);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  let query = supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (tab === "seguiti") {
    const { data: followedRows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followsError) {
      throw followsError;
    }

    const followedUserIds = unique(
      (followedRows ?? [])
        .map((row) => row.following_id)
        .filter((followingId) => !hiddenUserIds.has(followingId)),
    );
    if (followedUserIds.length === 0) {
      return { posts: [], warning: null };
    }

    query = query.in("user_id", followedUserIds);
  }

  const { data: postRows, error: postsError } = await query;
  if (postsError) {
    throw postsError;
  }

  const posts = await hydratePosts(
    supabase,
    user.id,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
  return { posts, warning: null };
}

export async function getPostsByAuthor(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  authorUserId: string,
): Promise<FeedPost[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );
  if (hiddenUserIds.has(authorUserId)) {
    return [];
  }

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .eq("user_id", authorUserId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw error;
  }

  return hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
}

export async function getSavedPosts(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
): Promise<FeedPost[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", viewerUserId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (savedError) {
    throw savedError;
  }

  const saved = savedRows ?? [];
  if (saved.length === 0) {
    return [];
  }

  const postIds = saved.map((row) => row.post_id);
  const { data: postRows, error: postsError } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .in("id", postIds);

  if (postsError) {
    throw postsError;
  }

  const hydratedPosts = await hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
  const savedTimeByPostId = new Map(saved.map((row) => [row.post_id, row.created_at]));

  return hydratedPosts.sort((a, b) =>
    sortDescByDate(savedTimeByPostId.get(a.id) ?? a.createdAt, savedTimeByPostId.get(b.id) ?? b.createdAt),
  );
}

export async function getPostById(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  postId: string,
): Promise<FeedPost | null> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .eq("id", postId)
    .limit(1);

  if (error) {
    throw error;
  }

  const hydrated = await hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
  return hydrated[0] ?? null;
}

export async function getRecentPosts(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  limit = 24,
): Promise<FeedPost[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
}

export async function getRecentPostsByPassion(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  passionSlug: string,
  limit = 24,
): Promise<FeedPost[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .eq("passion_slug", passionSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
}

export async function searchPosts(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  rawTerm: string,
  limit = 20,
): Promise<FeedPost[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, viewerUserId);
  const hiddenUserIds = createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
  );

  const term = normalizeSearchTerm(rawTerm);
  if (term.length < 2) {
    return [];
  }

  const pattern = `%${term}%`;
  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, passion_slug, content_type, text_content, created_at, updated_at")
    .or(`text_content.ilike.${pattern},passion_slug.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const hydrated = await hydratePosts(
    supabase,
    viewerUserId,
    excludeBlockedPostRows(postRows ?? [], hiddenUserIds),
    hiddenUserIds,
  );
  return dedupePostsById(hydrated);
}

