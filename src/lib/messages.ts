import type { SupabaseClient } from "@supabase/supabase-js";
import { areUsersBlocked, canUserMessageTarget } from "@/lib/privacy";
import type { Database } from "@/types/database";

export type ConversationListItem = {
  conversationId: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessageText: string | null;
  lastMessageAt: string;
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  createdAt: string;
  isMine: boolean;
};

export type ConversationMessagesData = {
  conversationId: string;
  participants: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }[];
  messages: ConversationMessage[];
  canSendMessages: boolean;
  sendBlockedReason: string | null;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
};

type UserLookup = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function sortByRecentDateDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
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

export async function getExistingDirectConversationId(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  targetUserId: string,
): Promise<string | null> {
  const { data: currentRows, error: currentRowsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (currentRowsError) {
    throw currentRowsError;
  }

  const candidateIds = unique((currentRows ?? []).map((row) => row.conversation_id));
  if (candidateIds.length === 0) {
    return null;
  }

  const { data: targetRows, error: targetRowsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", targetUserId)
    .in("conversation_id", candidateIds);

  if (targetRowsError) {
    throw targetRowsError;
  }

  const existingConversationId = targetRows?.[0]?.conversation_id ?? null;
  return existingConversationId;
}

export async function createDirectConversation(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  targetUserId: string,
): Promise<string> {
  const { data: createdConversation, error: createConversationError } = await supabase
    .from("conversations")
    .insert({
      created_by: currentUserId,
    })
    .select("id")
    .single();

  if (createConversationError || !createdConversation) {
    throw createConversationError ?? new Error("Creazione conversazione non riuscita.");
  }

  const { error: insertParticipantsError } = await supabase
    .from("conversation_participants")
    .insert([
      {
        conversation_id: createdConversation.id,
        user_id: currentUserId,
      },
      {
        conversation_id: createdConversation.id,
        user_id: targetUserId,
      },
    ]);

  if (insertParticipantsError) {
    await supabase
      .from("conversations")
      .delete()
      .eq("id", createdConversation.id)
      .eq("created_by", currentUserId);
    throw insertParticipantsError;
  }

  return createdConversation.id;
}

export async function getOrCreateDirectConversation(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  targetUserId: string,
): Promise<{ conversationId: string | null; reason: string | null }> {
  const permission = await canUserMessageTarget(supabase, currentUserId, targetUserId);
  if (!permission.allowed) {
    return { conversationId: null, reason: permission.reason };
  }

  const existingConversationId = await getExistingDirectConversationId(
    supabase,
    currentUserId,
    targetUserId,
  );
  if (existingConversationId) {
    return { conversationId: existingConversationId, reason: null };
  }

  const createdConversationId = await createDirectConversation(
    supabase,
    currentUserId,
    targetUserId,
  );
  return { conversationId: createdConversationId, reason: null };
}

export async function getConversationList(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
): Promise<ConversationListItem[]> {
  const { data: myParticipantRows, error: myParticipantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myParticipantError) {
    throw myParticipantError;
  }

  const conversationIds = unique(
    (myParticipantRows ?? []).map((row) => row.conversation_id),
  );
  if (conversationIds.length === 0) {
    return [];
  }

  const [
    { data: participantRows, error: participantsError },
    { data: conversationsRows, error: conversationsError },
    { data: messagesRows, error: messagesError },
  ] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds),
    supabase
      .from("conversations")
      .select("id, created_at")
      .in("id", conversationIds),
    supabase
      .from("messages")
      .select("id, conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (participantsError) {
    throw participantsError;
  }
  if (conversationsError) {
    throw conversationsError;
  }
  if (messagesError) {
    throw messagesError;
  }

  const participantsByConversation = new Map<string, string[]>();
  (participantRows ?? []).forEach((row) => {
    const current = participantsByConversation.get(row.conversation_id) ?? [];
    current.push(row.user_id);
    participantsByConversation.set(row.conversation_id, current);
  });

  const otherUserIds = unique(
    conversationIds
      .map((conversationId) => {
        const users = participantsByConversation.get(conversationId) ?? [];
        return users.find((userId) => userId !== currentUserId) ?? null;
      })
      .filter((userId): userId is string => Boolean(userId)),
  );
  const usersById = await fetchUsersByIds(supabase, otherUserIds);

  const conversationCreatedAtById = new Map(
    (conversationsRows ?? []).map((row) => [row.id, row.created_at]),
  );

  const lastMessageByConversationId = new Map<string, { text: string; createdAt: string }>();
  (messagesRows ?? []).forEach((row) => {
    if (!lastMessageByConversationId.has(row.conversation_id)) {
      lastMessageByConversationId.set(row.conversation_id, {
        text: row.content,
        createdAt: row.created_at,
      });
    }
  });

  const listItems = conversationIds
    .map((conversationId) => {
      const users = participantsByConversation.get(conversationId) ?? [];
      const otherUserId = users.find((userId) => userId !== currentUserId);

      if (!otherUserId) {
        return null;
      }

      const otherUser = usersById.get(otherUserId);
      if (!otherUser) {
        return null;
      }

      const lastMessage = lastMessageByConversationId.get(conversationId);
      return {
        conversationId,
        otherUserId,
        otherUsername: otherUser.username,
        otherDisplayName: otherUser.display_name,
        otherAvatarUrl: otherUser.avatar_url,
        lastMessageText: lastMessage?.text ?? null,
        lastMessageAt:
          lastMessage?.createdAt ??
          conversationCreatedAtById.get(conversationId) ??
          new Date(0).toISOString(),
      };
    })
    .filter((item): item is ConversationListItem => Boolean(item));

  return listItems.sort((a, b) => sortByRecentDateDesc(a.lastMessageAt, b.lastMessageAt));
}

export async function getConversationMessages(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  conversationId: string,
): Promise<ConversationMessagesData | null> {
  const { data: myParticipantRows, error: myParticipantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .limit(1);

  if (myParticipantError) {
    throw myParticipantError;
  }

  if (!myParticipantRows || myParticipantRows.length === 0) {
    return null;
  }

  const [{ data: participantRows, error: participantsError }, { data: messagesRows, error: messagesError }] =
    await Promise.all([
      supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId),
      supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(300),
    ]);

  if (participantsError) {
    throw participantsError;
  }
  if (messagesError) {
    throw messagesError;
  }

  const participantIds = unique((participantRows ?? []).map((row) => row.user_id));
  const otherParticipantId = participantIds.find((participantId) => participantId !== currentUserId);

  const usersById = await fetchUsersByIds(supabase, participantIds);

  const participants = participantIds
    .map((userId) => {
      const user = usersById.get(userId);
      if (!user) {
        return null;
      }

      return {
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      };
    })
    .filter((user): user is NonNullable<typeof user> => Boolean(user));

  const messages: ConversationMessage[] = (messagesRows ?? []).map((row) => {
    const sender = usersById.get(row.sender_id);
    return {
      id: row.id,
      senderId: row.sender_id,
      senderUsername: sender?.username ?? "utente",
      senderDisplayName: sender?.display_name ?? "@utente",
      content: row.content,
      createdAt: row.created_at,
      isMine: row.sender_id === currentUserId,
    };
  });

  let canSendMessages = false;
  let sendBlockedReason: string | null =
    "Non puoi piu inviare messaggi in questa conversazione.";
  let isBlockedByMe = false;
  let hasBlockedMe = false;

  if (otherParticipantId) {
    const blockedStatus = await areUsersBlocked(
      supabase,
      currentUserId,
      otherParticipantId,
    );
    isBlockedByMe = blockedStatus.firstBlockedSecond;
    hasBlockedMe = blockedStatus.secondBlockedFirst;

    const permission = await canUserMessageTarget(
      supabase,
      currentUserId,
      otherParticipantId,
    );
    canSendMessages = permission.allowed;
    if (isBlockedByMe) {
      sendBlockedReason =
        "Hai bloccato questo utente. Non puoi piu inviare messaggi.";
    } else {
      sendBlockedReason =
        permission.reason ?? "Non puoi piu inviare messaggi in questa conversazione.";
    }
  }

  return {
    conversationId,
    participants,
    messages,
    canSendMessages,
    sendBlockedReason: canSendMessages ? null : sendBlockedReason,
    isBlockedByMe,
    hasBlockedMe,
  };
}

