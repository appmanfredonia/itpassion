import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const USERNAME_REGEX = /^[a-z0-9_.]{3,24}$/;

export type AppProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

function isRelationMissingError(error: PostgrestError | null): boolean {
  return error?.code === "42P01";
}

function getMetadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeUsername(rawValue: string): string {
  return rawValue.toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

function toValidUsernameOrNull(rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  const normalized = sanitizeUsername(rawValue).slice(0, 24);
  if (!USERNAME_REGEX.test(normalized)) {
    return null;
  }

  return normalized;
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function normalizeUsername(username: string): string {
  return sanitizeUsername(username.trim()).slice(0, 24);
}

function buildFallbackUsername(user: User): string {
  const metadataUsername = toValidUsernameOrNull(getMetadataString(user, "username"));
  if (metadataUsername) {
    return metadataUsername;
  }

  const emailPrefix = user.email?.split("@")[0] ?? "";
  const emailUsername = sanitizeUsername(emailPrefix).slice(0, 24);
  if (USERNAME_REGEX.test(emailUsername)) {
    return emailUsername;
  }

  return `utente_${user.id.replace(/-/g, "").slice(0, 8)}`;
}

function buildDisplayName(user: User, username: string): string {
  return (
    getMetadataString(user, "display_name") ??
    getMetadataString(user, "full_name") ??
    username
  );
}

type UserProfileSelection = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "username" | "display_name" | "bio" | "avatar_url"
>;

function mapProfileRow(row: UserProfileSelection): AppProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
  };
}

export function buildFallbackProfileFromAuthUser(user: User): AppProfile {
  const username = buildFallbackUsername(user);
  return {
    id: user.id,
    username,
    displayName: buildDisplayName(user, username),
    bio: getMetadataString(user, "bio"),
    avatarUrl: getMetadataString(user, "avatar_url"),
  };
}

export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<AppProfile | null> {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("users")
    .select("id, username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    if (isRelationMissingError(existingProfileError)) {
      return null;
    }
    throw existingProfileError;
  }

  if (existingProfile) {
    return mapProfileRow(existingProfile);
  }

  const baseProfile = buildFallbackProfileFromAuthUser(user);
  const usernameFromMetadata = toValidUsernameOrNull(getMetadataString(user, "username"));
  const preferredUsername = usernameFromMetadata ?? baseProfile.username;

  const basePayload = {
    id: user.id,
    username: preferredUsername,
    display_name: buildDisplayName(user, preferredUsername),
    bio: getMetadataString(user, "bio"),
    avatar_url: getMetadataString(user, "avatar_url"),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(basePayload, { onConflict: "id" })
    .select("id, username, display_name, bio, avatar_url")
    .single();

  if (!error && data) {
    return mapProfileRow(data);
  }

  if (isRelationMissingError(error)) {
    return null;
  }

  if (error?.code === "23505") {
    const conflictSafeUsername = `utente_${user.id.replace(/-/g, "").slice(0, 8)}`;
    const { data: retryData, error: retryError } = await supabase
      .from("users")
      .upsert(
        {
          ...basePayload,
          username: conflictSafeUsername,
          display_name: buildDisplayName(user, conflictSafeUsername),
        },
        { onConflict: "id" },
      )
      .select("id, username, display_name, bio, avatar_url")
      .single();

    if (!retryError && retryData) {
      return mapProfileRow(retryData);
    }

    if (isRelationMissingError(retryError)) {
      return null;
    }

    throw retryError;
  }

  throw error;
}

export async function getProfileById(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AppProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, bio, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isRelationMissingError(error)) {
      return null;
    }
    throw error;
  }

  return data ? mapProfileRow(data) : null;
}

export async function getProfileByUsername(
  supabase: SupabaseClient<Database>,
  username: string,
): Promise<AppProfile | null> {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, bio, avatar_url")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    if (isRelationMissingError(error)) {
      return null;
    }
    throw error;
  }

  return data ? mapProfileRow(data) : null;
}
