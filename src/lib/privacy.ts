import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type MessagePermission = {
  allowed: boolean;
  reason: string | null;
};

export type UserPrivacySettings = {
  userId: string;
  isProfilePrivate: boolean;
  whoCanMessage: "everyone" | "followers" | "nobody";
  showOnlineStatus: boolean;
};

export type BlockedUserListItem = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
};

export type BlockVisibilitySets = {
  blockedByMeIds: string[];
  blockedMeIds: string[];
};

function isMessagingRule(value: string): value is "everyone" | "followers" | "nobody" {
  return value === "everyone" || value === "followers" || value === "nobody";
}

const DEFAULT_PRIVACY_SETTINGS: Omit<UserPrivacySettings, "userId"> = {
  isProfilePrivate: false,
  whoCanMessage: "everyone",
  showOnlineStatus: true,
};

export async function ensurePrivacySettings(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserPrivacySettings> {
  const { data, error } = await supabase
    .from("privacy_settings")
    .upsert(
      {
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, is_profile_private, who_can_message, show_online_status")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      userId,
      ...DEFAULT_PRIVACY_SETTINGS,
    };
  }

  return {
    userId: data.user_id,
    isProfilePrivate: data.is_profile_private,
    whoCanMessage: isMessagingRule(data.who_can_message)
      ? data.who_can_message
      : "everyone",
    showOnlineStatus: data.show_online_status,
  };
}

export async function getUserPrivacySettings(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserPrivacySettings> {
  const { data, error } = await supabase
    .from("privacy_settings")
    .select("user_id, is_profile_private, who_can_message, show_online_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      userId,
      ...DEFAULT_PRIVACY_SETTINGS,
    };
  }

  return {
    userId: data.user_id,
    isProfilePrivate: data.is_profile_private,
    whoCanMessage: isMessagingRule(data.who_can_message)
      ? data.who_can_message
      : "everyone",
    showOnlineStatus: data.show_online_status,
  };
}

export async function areUsersBlocked(
  supabase: SupabaseClient<Database>,
  firstUserId: string,
  secondUserId: string,
): Promise<{
  firstBlockedSecond: boolean;
  secondBlockedFirst: boolean;
}> {
  const [firstToSecond, secondToFirst] = await Promise.all([
    supabase
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocker_id", firstUserId)
      .eq("blocked_id", secondUserId)
      .limit(1),
    supabase
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocker_id", secondUserId)
      .eq("blocked_id", firstUserId)
      .limit(1),
  ]);

  if (firstToSecond.error) {
    throw firstToSecond.error;
  }
  if (secondToFirst.error) {
    throw secondToFirst.error;
  }

  return {
    firstBlockedSecond: (firstToSecond.data ?? []).length > 0,
    secondBlockedFirst: (secondToFirst.data ?? []).length > 0,
  };
}

export async function blockUserById(
  supabase: SupabaseClient<Database>,
  blockerUserId: string,
  blockedUserId: string,
): Promise<void> {
  if (blockerUserId === blockedUserId) {
    throw new Error("Non puoi bloccare te stesso.");
  }

  const { error } = await supabase.from("blocked_users").upsert(
    {
      blocker_id: blockerUserId,
      blocked_id: blockedUserId,
    },
    { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
  );

  if (error) {
    throw error;
  }
}

export async function unblockUserById(
  supabase: SupabaseClient<Database>,
  blockerUserId: string,
  blockedUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerUserId)
    .eq("blocked_id", blockedUserId);

  if (error) {
    throw error;
  }
}

export async function getBlockVisibilitySets(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BlockVisibilitySets> {
  const [{ data: blockedByMeRows, error: blockedByMeError }, { data: blockedMeRows, error: blockedMeError }] =
    await Promise.all([
      supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", userId),
      supabase
        .from("blocked_users")
        .select("blocker_id")
        .eq("blocked_id", userId),
    ]);

  if (blockedByMeError) {
    throw blockedByMeError;
  }
  if (blockedMeError) {
    throw blockedMeError;
  }

  return {
    blockedByMeIds: (blockedByMeRows ?? []).map((row) => row.blocked_id),
    blockedMeIds: (blockedMeRows ?? []).map((row) => row.blocker_id),
  };
}

export async function canUserMessageTarget(
  supabase: SupabaseClient<Database>,
  senderUserId: string,
  recipientUserId: string,
): Promise<MessagePermission> {
  if (senderUserId === recipientUserId) {
    return {
      allowed: false,
      reason: "Non puoi avviare una conversazione con te stesso.",
    };
  }

  const blockedStatus = await areUsersBlocked(supabase, senderUserId, recipientUserId);
  if (blockedStatus.firstBlockedSecond) {
    return {
      allowed: false,
      reason: "Hai bloccato questo utente. Sbloccalo per scrivergli.",
    };
  }
  if (blockedStatus.secondBlockedFirst) {
    return {
      allowed: false,
      reason: "Non puoi scrivere a questo utente.",
    };
  }

  const recipientPrivacy = await getUserPrivacySettings(supabase, recipientUserId);
  if (recipientPrivacy.whoCanMessage === "nobody") {
    return {
      allowed: false,
      reason: "Questo utente non accetta nuovi messaggi.",
    };
  }

  if (recipientPrivacy.whoCanMessage === "followers") {
    const { data: followRows, error: followError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", senderUserId)
      .eq("following_id", recipientUserId)
      .limit(1);

    if (followError) {
      throw followError;
    }

    if ((followRows ?? []).length === 0) {
      return {
        allowed: false,
        reason: "Questo utente accetta messaggi solo dai follower.",
      };
    }
  }

  return { allowed: true, reason: null };
}

export async function getBlockedUsersList(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BlockedUserListItem[]> {
  const { data: blockedRows, error: blockedError } = await supabase
    .from("blocked_users")
    .select("blocked_id, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (blockedError) {
    throw blockedError;
  }

  if (!blockedRows || blockedRows.length === 0) {
    return [];
  }

  const blockedIds = blockedRows.map((row) => row.blocked_id);
  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url")
    .in("id", blockedIds);

  if (usersError) {
    throw usersError;
  }

  const userById = new Map((usersRows ?? []).map((row) => [row.id, row]));
  return blockedRows.map((row) => {
    const blockedUser = userById.get(row.blocked_id);
    const fallbackTag = row.blocked_id.slice(0, 8);

    return {
      userId: row.blocked_id,
      username:
        blockedUser?.username && blockedUser.username.trim().length > 0
          ? blockedUser.username
          : `utente_${fallbackTag}`,
      displayName:
        blockedUser?.display_name && blockedUser.display_name.trim().length > 0
          ? blockedUser.display_name
          : "Profilo non disponibile",
      avatarUrl: blockedUser?.avatar_url ?? null,
      blockedAt: row.created_at,
    };
  });
}
