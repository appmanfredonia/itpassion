import type { SupabaseClient } from "@supabase/supabase-js";
import { getBlockVisibilitySets } from "@/lib/privacy";
import type { Database } from "@/types/database";

export type NotificationType = "follow" | "like" | "comment" | "message" | "conversation";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actorUserId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  href: string;
  relatedPostId: string | null;
  previewImageUrl: string | null;
};

type UserLookup = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type PostLookup = {
  id: string;
  text_content: string | null;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function sortByDateDesc(a: NotificationItem, b: NotificationItem): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function fallbackUsername(userId: string): string {
  return `utente_${userId.replace(/-/g, "").slice(0, 8)}`;
}

function truncate(value: string, length = 100): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, length - 1))}...`;
}

async function fetchUsersByIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, UserLookup>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.id, row]));
}

function actorData(usersById: Map<string, UserLookup>, actorUserId: string): {
  username: string;
  displayName: string;
  avatarUrl: string | null;
} {
  const actor = usersById.get(actorUserId);
  const username = actor?.username ?? fallbackUsername(actorUserId);
  return {
    username,
    displayName: actor?.display_name ?? `@${username}`,
    avatarUrl: actor?.avatar_url ?? null,
  };
}

export async function getNotifications(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  limit = 40,
): Promise<NotificationItem[]> {
  const blockVisibility = await getBlockVisibilitySets(supabase, currentUserId);
  const hiddenActors = new Set([
    ...blockVisibility.blockedByMeIds,
    ...blockVisibility.blockedMeIds,
  ]);

  const [
    { data: followRows, error: followError },
    { data: myPostsRows, error: myPostsError },
    { data: myConversationRows, error: myConversationError },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(limit * 2),
    supabase
      .from("posts")
      .select("id, text_content")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId),
  ]);

  if (followError) {
    throw followError;
  }
  if (myPostsError) {
    throw myPostsError;
  }
  if (myConversationError) {
    throw myConversationError;
  }

  const myPostRows = myPostsRows ?? [];
  const myPostIds = myPostRows.map((row) => row.id);
  const postById = new Map<string, PostLookup>(myPostRows.map((row) => [row.id, row]));

  const conversationIds = unique((myConversationRows ?? []).map((row) => row.conversation_id));

  const [
    likesResponse,
    commentsResponse,
    messagesResponse,
    conversationsResponse,
  ] = await Promise.all([
    myPostIds.length > 0
      ? supabase
          .from("likes")
          .select("post_id, user_id, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit * 2)
      : Promise.resolve({ data: [], error: null }),
    myPostIds.length > 0
      ? supabase
          .from("comments")
          .select("id, post_id, user_id, content, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit * 2)
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .in("conversation_id", conversationIds)
          .neq("sender_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit * 2)
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length > 0
      ? supabase
          .from("conversations")
          .select("id, created_by, created_at")
          .in("id", conversationIds)
          .neq("created_by", currentUserId)
          .order("created_at", { ascending: false })
          .limit(limit * 2)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (likesResponse.error) {
    throw likesResponse.error;
  }
  if (commentsResponse.error) {
    throw commentsResponse.error;
  }
  if (messagesResponse.error) {
    throw messagesResponse.error;
  }
  if (conversationsResponse.error) {
    throw conversationsResponse.error;
  }

  const relatedPostIds = unique([
    ...(likesResponse.data ?? []).map((row) => row.post_id),
    ...(commentsResponse.data ?? []).map((row) => row.post_id),
  ]);
  const { data: mediaRows, error: mediaError } =
    relatedPostIds.length > 0
      ? await supabase
          .from("post_media")
          .select("post_id, media_url")
          .in("post_id", relatedPostIds)
      : { data: [], error: null };

  if (mediaError) {
    throw mediaError;
  }

  const previewImageByPostId = new Map<string, string>();
  (mediaRows ?? []).forEach((row) => {
    if (!previewImageByPostId.has(row.post_id)) {
      previewImageByPostId.set(row.post_id, row.media_url);
    }
  });

  const actorIds = unique([
    ...(followRows ?? []).map((row) => row.follower_id),
    ...(likesResponse.data ?? []).map((row) => row.user_id),
    ...(commentsResponse.data ?? []).map((row) => row.user_id),
    ...(messagesResponse.data ?? []).map((row) => row.sender_id),
    ...(conversationsResponse.data ?? []).map((row) => row.created_by),
  ]).filter((userId) => !hiddenActors.has(userId));

  const usersById = await fetchUsersByIds(supabase, actorIds);

  const notifications: NotificationItem[] = [];

  (followRows ?? []).forEach((row) => {
    if (hiddenActors.has(row.follower_id)) {
      return;
    }

    const actor = actorData(usersById, row.follower_id);
    notifications.push({
      id: `follow:${row.follower_id}:${row.created_at}`,
      type: "follow",
      actorUserId: row.follower_id,
      actorUsername: actor.username,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      content: "ha iniziato a seguirti.",
      createdAt: row.created_at,
      href: `/profile/${actor.username}`,
      relatedPostId: null,
      previewImageUrl: null,
    });
  });

  (likesResponse.data ?? []).forEach((row) => {
    if (hiddenActors.has(row.user_id)) {
      return;
    }

    const actor = actorData(usersById, row.user_id);
    const post = postById.get(row.post_id);
    const postHint = post?.text_content ? ` "${truncate(post.text_content, 70)}"` : "";
    notifications.push({
      id: `like:${row.post_id}:${row.user_id}:${row.created_at}`,
      type: "like",
      actorUserId: row.user_id,
      actorUsername: actor.username,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      content: `ha messo mi piace al tuo post${postHint}.`,
      createdAt: row.created_at,
      href: `/feed?post=${row.post_id}`,
      relatedPostId: row.post_id,
      previewImageUrl: previewImageByPostId.get(row.post_id) ?? null,
    });
  });

  (commentsResponse.data ?? []).forEach((row) => {
    if (hiddenActors.has(row.user_id)) {
      return;
    }

    const actor = actorData(usersById, row.user_id);
    notifications.push({
      id: `comment:${row.id}`,
      type: "comment",
      actorUserId: row.user_id,
      actorUsername: actor.username,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      content: `ha commentato: "${truncate(row.content, 90)}"`,
      createdAt: row.created_at,
      href: `/feed?post=${row.post_id}`,
      relatedPostId: row.post_id,
      previewImageUrl: previewImageByPostId.get(row.post_id) ?? null,
    });
  });

  (messagesResponse.data ?? []).forEach((row) => {
    if (hiddenActors.has(row.sender_id)) {
      return;
    }

    const actor = actorData(usersById, row.sender_id);
    notifications.push({
      id: `message:${row.id}`,
      type: "message",
      actorUserId: row.sender_id,
      actorUsername: actor.username,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      content: `ti ha scritto: "${truncate(row.content, 90)}"`,
      createdAt: row.created_at,
      href: `/messages?c=${row.conversation_id}`,
      relatedPostId: null,
      previewImageUrl: null,
    });
  });

  (conversationsResponse.data ?? []).forEach((row) => {
    if (hiddenActors.has(row.created_by)) {
      return;
    }

    const actor = actorData(usersById, row.created_by);
    notifications.push({
      id: `conversation:${row.id}:${row.created_at}`,
      type: "conversation",
      actorUserId: row.created_by,
      actorUsername: actor.username,
      actorDisplayName: actor.displayName,
      actorAvatarUrl: actor.avatarUrl,
      content: "ha avviato una conversazione con te.",
      createdAt: row.created_at,
      href: `/messages?c=${row.id}`,
      relatedPostId: null,
      previewImageUrl: null,
    });
  });

  return notifications.sort(sortByDateDesc).slice(0, limit);
}
