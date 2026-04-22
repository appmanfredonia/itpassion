import type { SupabaseClient } from "@supabase/supabase-js";
import { formatLocationLabel, normalizeProvinceMatchKey, resolveItalianLocation } from "@/lib/location";
import { getBlockVisibilitySets, getHiddenPrivateProfileIds } from "@/lib/privacy";
import type { Database } from "@/types/database";

export type RitualColorTheme = {
  key: string;
  marker: string;
  markerSoft: string;
  badgeText: string;
  badgeBackground: string;
  badgeBorder: string;
};

export type ViewerLocalTribe = {
  id: string;
  passionSlug: string;
  passionName: string;
  province: string;
  provinceKey: string;
  label: string;
  color: RitualColorTheme;
};

export type RitualParticipant = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type RitualSummary = {
  id: string;
  tribeId: string;
  tribeLabel: string;
  title: string;
  description: string | null;
  city: string | null;
  province: string;
  place: string | null;
  scheduledFor: string;
  createdAt: string;
  updatedAt: string;
  latitude: number | null;
  longitude: number | null;
  passionSlug: string;
  passionName: string;
  color: RitualColorTheme;
  creatorId: string;
  creatorDisplayName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  participantCount: number;
  joinedByMe: boolean;
  isCreator: boolean;
  maxParticipants: number | null;
  remainingSpots: number | null;
};

export type RitualDetail = RitualSummary & {
  participants: RitualParticipant[];
};

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type LocalTribeRow = Database["public"]["Tables"]["local_tribes"]["Row"];
type TribeRitualParticipantRow = Database["public"]["Tables"]["tribe_ritual_participants"]["Row"];

const PASSION_COLOR_PRESETS: Record<string, RitualColorTheme> = {
  musica: {
    key: "musica",
    marker: "oklch(0.73 0.165 294)",
    markerSoft: "oklch(0.73 0.165 294 / 0.18)",
    badgeText: "oklch(0.9 0.045 290)",
    badgeBackground: "oklch(0.73 0.165 294 / 0.1)",
    badgeBorder: "oklch(0.73 0.165 294 / 0.24)",
  },
  fotografia: {
    key: "fotografia",
    marker: "oklch(0.7 0.15 243)",
    markerSoft: "oklch(0.7 0.15 243 / 0.18)",
    badgeText: "oklch(0.88 0.04 244)",
    badgeBackground: "oklch(0.7 0.15 243 / 0.1)",
    badgeBorder: "oklch(0.7 0.15 243 / 0.24)",
  },
  fitness: {
    key: "fitness",
    marker: "oklch(0.79 0.17 153)",
    markerSoft: "oklch(0.79 0.17 153 / 0.2)",
    badgeText: "oklch(0.91 0.05 156)",
    badgeBackground: "oklch(0.79 0.17 153 / 0.1)",
    badgeBorder: "oklch(0.79 0.17 153 / 0.24)",
  },
  cucina: {
    key: "cucina",
    marker: "oklch(0.77 0.17 54)",
    markerSoft: "oklch(0.77 0.17 54 / 0.2)",
    badgeText: "oklch(0.92 0.05 62)",
    badgeBackground: "oklch(0.77 0.17 54 / 0.11)",
    badgeBorder: "oklch(0.77 0.17 54 / 0.24)",
  },
  viaggi: {
    key: "viaggi",
    marker: "oklch(0.8 0.1 215)",
    markerSoft: "oklch(0.8 0.1 215 / 0.2)",
    badgeText: "oklch(0.91 0.03 215)",
    badgeBackground: "oklch(0.8 0.1 215 / 0.11)",
    badgeBorder: "oklch(0.8 0.1 215 / 0.24)",
  },
};

const FALLBACK_COLORS: RitualColorTheme[] = [
  {
    key: "rosa",
    marker: "oklch(0.75 0.14 342)",
    markerSoft: "oklch(0.75 0.14 342 / 0.2)",
    badgeText: "oklch(0.9 0.04 342)",
    badgeBackground: "oklch(0.75 0.14 342 / 0.11)",
    badgeBorder: "oklch(0.75 0.14 342 / 0.24)",
  },
  {
    key: "teal",
    marker: "oklch(0.76 0.11 192)",
    markerSoft: "oklch(0.76 0.11 192 / 0.2)",
    badgeText: "oklch(0.9 0.03 192)",
    badgeBackground: "oklch(0.76 0.11 192 / 0.11)",
    badgeBorder: "oklch(0.76 0.11 192 / 0.24)",
  },
  {
    key: "rosso",
    marker: "oklch(0.68 0.19 24)",
    markerSoft: "oklch(0.68 0.19 24 / 0.22)",
    badgeText: "oklch(0.91 0.04 24)",
    badgeBackground: "oklch(0.68 0.19 24 / 0.11)",
    badgeBorder: "oklch(0.68 0.19 24 / 0.24)",
  },
];

type RitualQueryOptions = {
  tribeIds?: string[];
  creatorId?: string;
  ritualId?: string;
  upcomingOnly?: boolean;
  limit?: number;
  includeParticipants?: boolean;
  sort?: "scheduled-asc" | "created-desc";
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function fallbackUsername(userId: string): string {
  return `utente_${userId.replace(/-/g, "").slice(0, 8)}`;
}

function isRelationMissingError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01";
}

function createHiddenUserSet(
  blockedByMeIds: string[],
  blockedMeIds: string[],
  hiddenPrivateProfileIds: string[],
): Set<string> {
  return new Set([...blockedByMeIds, ...blockedMeIds, ...hiddenPrivateProfileIds]);
}

async function getHiddenUserSetForViewer(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
): Promise<Set<string>> {
  const [blockVisibility, hiddenPrivateProfileIds] = await Promise.all([
    getBlockVisibilitySets(supabase, viewerUserId),
    getHiddenPrivateProfileIds(supabase, viewerUserId),
  ]);

  return createHiddenUserSet(
    blockVisibility.blockedByMeIds,
    blockVisibility.blockedMeIds,
    hiddenPrivateProfileIds,
  );
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
    .select(
      "id, username, display_name, bio, avatar_url, city, province, region, latitude, longitude, created_at, updated_at",
    )
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getPassionNameMap(
  supabase: SupabaseClient<Database>,
  passionSlugs: string[],
): Promise<Map<string, string>> {
  if (passionSlugs.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("passions")
    .select("slug, name")
    .in("slug", passionSlugs);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.slug, row.name]));
}

function getFallbackColorIndex(slug: string): number {
  return slug.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % FALLBACK_COLORS.length;
}

export function getRitualColorTheme(passionSlug: string): RitualColorTheme {
  const normalizedSlug = passionSlug.trim().toLowerCase();
  return PASSION_COLOR_PRESETS[normalizedSlug] ?? FALLBACK_COLORS[getFallbackColorIndex(normalizedSlug)];
}

function toUserMap(users: UserRow[]): Map<string, UserRow> {
  return new Map(users.map((row) => [row.id, row]));
}

function computeRemainingSpots(
  participantCount: number,
  maxParticipants: number | null,
): number | null {
  if (!maxParticipants) {
    return null;
  }

  return Math.max(0, maxParticipants - participantCount);
}

function createTribeLabel(passionName: string, province: string): string {
  return `Tribu ${passionName} - ${province}`;
}

async function fetchViewerTribeRows(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
): Promise<{ tribeRows: LocalTribeRow[]; warning: string | null }> {
  const membershipsResult = await supabase
    .from("local_tribe_memberships")
    .select("tribe_id")
    .eq("user_id", viewerUserId);

  if (membershipsResult.error) {
    if (isRelationMissingError(membershipsResult.error)) {
      return {
        tribeRows: [],
        warning:
          "Le tribu locali non sono ancora attive in questo ambiente. Applica prima la migration delle tribu per attivare i rituali.",
      };
    }

    throw membershipsResult.error;
  }

  const tribeIds = unique((membershipsResult.data ?? []).map((row) => row.tribe_id));
  if (tribeIds.length === 0) {
    return { tribeRows: [], warning: null };
  }

  const tribesResult = await supabase
    .from("local_tribes")
    .select("id, passion_slug, province, province_key, created_at, updated_at")
    .in("id", tribeIds);

  if (tribesResult.error) {
    throw tribesResult.error;
  }

  return { tribeRows: tribesResult.data ?? [], warning: null };
}

export async function getViewerLocalTribes(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
): Promise<{ tribes: ViewerLocalTribe[]; warning: string | null }> {
  const { tribeRows, warning } = await fetchViewerTribeRows(supabase, viewerUserId);
  if (tribeRows.length === 0) {
    return { tribes: [], warning };
  }

  const passionNameMap = await getPassionNameMap(
    supabase,
    unique(tribeRows.map((row) => row.passion_slug)),
  );

  const tribes = tribeRows
    .map((tribeRow) => {
      const passionName = passionNameMap.get(tribeRow.passion_slug) ?? tribeRow.passion_slug;
      return {
        id: tribeRow.id,
        passionSlug: tribeRow.passion_slug,
        passionName,
        province: tribeRow.province,
        provinceKey: tribeRow.province_key,
        label: createTribeLabel(passionName, tribeRow.province),
        color: getRitualColorTheme(tribeRow.passion_slug),
      } satisfies ViewerLocalTribe;
    })
    .sort((firstTribe, secondTribe) =>
      firstTribe.label.localeCompare(secondTribe.label, "it"),
    );

  return { tribes, warning };
}

export async function getRitualSummariesForViewer(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  options: RitualQueryOptions = {},
): Promise<{ rituals: RitualSummary[]; tribes: ViewerLocalTribe[]; warning: string | null }> {
  const hiddenUserIds = await getHiddenUserSetForViewer(supabase, viewerUserId);
  const { tribes, warning } = await getViewerLocalTribes(supabase, viewerUserId);
  if (tribes.length === 0) {
    return { rituals: [], tribes, warning };
  }

  const tribeRowsById = new Map(
    tribes.map((tribe) => [
      tribe.id,
      {
        id: tribe.id,
        passion_slug: tribe.passionSlug,
        province: tribe.province,
      },
    ]),
  );
  const accessibleTribeIds = unique(tribes.map((tribe) => tribe.id));
  const filteredTribeIds =
    options.tribeIds && options.tribeIds.length > 0
      ? options.tribeIds.filter((tribeId) => accessibleTribeIds.includes(tribeId))
      : accessibleTribeIds;

  if (filteredTribeIds.length === 0) {
    return { rituals: [], tribes, warning };
  }

  let ritualQuery = supabase
    .from("tribe_rituals")
    .select(
      "id, tribe_id, creator_id, title, description, city, place, max_participants, scheduled_for, created_at, updated_at",
    )
    .in("tribe_id", filteredTribeIds);

  if (options.ritualId) {
    ritualQuery = ritualQuery.eq("id", options.ritualId);
  }

  if (options.creatorId) {
    ritualQuery = ritualQuery.eq("creator_id", options.creatorId);
  }

  if (options.upcomingOnly) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    ritualQuery = ritualQuery.gte("scheduled_for", startOfToday.toISOString());
  }

  if (options.sort === "created-desc") {
    ritualQuery = ritualQuery.order("created_at", { ascending: false });
  } else {
    ritualQuery = ritualQuery.order("scheduled_for", { ascending: true });
  }

  if (options.limit) {
    ritualQuery = ritualQuery.limit(options.limit);
  }

  const ritualsResult = await ritualQuery;
  if (ritualsResult.error) {
    if (isRelationMissingError(ritualsResult.error)) {
      return {
        rituals: [],
        tribes,
        warning:
          "I rituali non sono ancora disponibili in questo ambiente. Applica la migration dedicata per attivare la feature.",
      };
    }

    throw ritualsResult.error;
  }

  const ritualRows = (ritualsResult.data ?? []).filter((row) => !hiddenUserIds.has(row.creator_id));
  if (ritualRows.length === 0) {
    return { rituals: [], tribes, warning };
  }

  const participantQuery = supabase
    .from("tribe_ritual_participants")
    .select("ritual_id, user_id, created_at")
    .in("ritual_id", unique(ritualRows.map((row) => row.id)));

  const [participantResult, creatorRows] = await Promise.all([
    participantQuery,
    fetchUsersByIds(supabase, unique(ritualRows.map((row) => row.creator_id))),
  ]);

  let participantRows: TribeRitualParticipantRow[] = [];
  let participantWarning: string | null = null;

  if (participantResult.error) {
    if (isRelationMissingError(participantResult.error)) {
      participantWarning =
        "Le partecipazioni ai rituali non sono ancora disponibili in questo ambiente: applica la migration dedicata per attivarle.";
    } else {
      throw participantResult.error;
    }
  } else {
    participantRows = (participantResult.data ?? []).filter(
      (row) => !hiddenUserIds.has(row.user_id),
    );
  }

  const creatorById = toUserMap(creatorRows);
  const participantCountByRitualId = new Map<string, number>();
  const joinedRitualIds = new Set<string>();

  participantRows.forEach((participantRow) => {
    participantCountByRitualId.set(
      participantRow.ritual_id,
      (participantCountByRitualId.get(participantRow.ritual_id) ?? 0) + 1,
    );
    if (participantRow.user_id === viewerUserId) {
      joinedRitualIds.add(participantRow.ritual_id);
    }
  });

  const rituals = ritualRows.map((ritualRow) => {
    const tribe = tribes.find((tribeOption) => tribeOption.id === ritualRow.tribe_id);
    const tribeFallback = tribeRowsById.get(ritualRow.tribe_id);
    const passionSlug = tribe?.passionSlug ?? tribeFallback?.passion_slug ?? "rituale";
    const passionName = tribe?.passionName ?? passionSlug;
    const province = tribe?.province ?? tribeFallback?.province ?? "";
    const resolvedLocation = resolveItalianLocation({
      city: ritualRow.city,
      province,
    });
    const participantCount = participantCountByRitualId.get(ritualRow.id) ?? 0;
    const creator = creatorById.get(ritualRow.creator_id);

    return {
      id: ritualRow.id,
      tribeId: ritualRow.tribe_id,
      tribeLabel: tribe?.label ?? createTribeLabel(passionName, province),
      title: ritualRow.title,
      description: ritualRow.description,
      city: ritualRow.city ?? resolvedLocation.location.city,
      province,
      place: ritualRow.place,
      scheduledFor: ritualRow.scheduled_for,
      createdAt: ritualRow.created_at,
      updatedAt: ritualRow.updated_at,
      latitude: resolvedLocation.location.latitude,
      longitude: resolvedLocation.location.longitude,
      passionSlug,
      passionName,
      color: tribe?.color ?? getRitualColorTheme(passionSlug),
      creatorId: ritualRow.creator_id,
      creatorDisplayName: creator?.display_name ?? `@${fallbackUsername(ritualRow.creator_id)}`,
      creatorUsername: creator?.username ?? fallbackUsername(ritualRow.creator_id),
      creatorAvatarUrl: creator?.avatar_url ?? null,
      participantCount,
      joinedByMe: joinedRitualIds.has(ritualRow.id),
      isCreator: ritualRow.creator_id === viewerUserId,
      maxParticipants: ritualRow.max_participants,
      remainingSpots: computeRemainingSpots(participantCount, ritualRow.max_participants),
    } satisfies RitualSummary;
  });

  return {
    rituals,
    tribes,
    warning: participantWarning ?? warning,
  };
}

export async function getRitualDetailForViewer(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  ritualId: string,
): Promise<{ ritual: RitualDetail | null; warning: string | null }> {
  const { rituals, warning } = await getRitualSummariesForViewer(supabase, viewerUserId, {
    ritualId,
    includeParticipants: true,
    sort: "scheduled-asc",
  });

  const baseRitual = rituals[0] ?? null;
  if (!baseRitual) {
    return { ritual: null, warning };
  }

  const participantResult = await supabase
    .from("tribe_ritual_participants")
    .select("ritual_id, user_id, created_at")
    .eq("ritual_id", ritualId);

  if (participantResult.error) {
    if (isRelationMissingError(participantResult.error)) {
      return {
        ritual: {
          ...baseRitual,
          participants: [],
        },
        warning:
          warning ??
          "Le partecipazioni ai rituali non sono ancora disponibili in questo ambiente.",
      };
    }

    throw participantResult.error;
  }

  const hiddenUserIds = await getHiddenUserSetForViewer(supabase, viewerUserId);
  const participantRows = (participantResult.data ?? []).filter(
    (participantRow) => !hiddenUserIds.has(participantRow.user_id),
  );

  const participantUsers = await fetchUsersByIds(
    supabase,
    unique(participantRows.map((participantRow) => participantRow.user_id)),
  );
  const participantUserById = toUserMap(participantUsers);

  const participants = participantRows
    .map((participantRow) => {
      const participantUser = participantUserById.get(participantRow.user_id);
      return {
        userId: participantRow.user_id,
        username: participantUser?.username ?? fallbackUsername(participantRow.user_id),
        displayName:
          participantUser?.display_name ?? `@${fallbackUsername(participantRow.user_id)}`,
        avatarUrl: participantUser?.avatar_url ?? null,
      } satisfies RitualParticipant;
    })
    .sort((firstParticipant, secondParticipant) =>
      firstParticipant.displayName.localeCompare(secondParticipant.displayName, "it"),
    );

  return {
    ritual: {
      ...baseRitual,
      participants,
      participantCount: participants.length,
      remainingSpots: computeRemainingSpots(participants.length, baseRitual.maxParticipants),
    },
    warning,
  };
}

export async function getRitualsByCreator(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  creatorId: string,
  limit = 6,
): Promise<{ rituals: RitualSummary[]; warning: string | null }> {
  const result = await getRitualSummariesForViewer(supabase, viewerUserId, {
    creatorId,
    limit,
    upcomingOnly: true,
    sort: "scheduled-asc",
  });

  return { rituals: result.rituals, warning: result.warning };
}

export async function getParticipatingRitualsForViewer(
  supabase: SupabaseClient<Database>,
  viewerUserId: string,
  limit = 6,
): Promise<{ rituals: RitualSummary[]; warning: string | null }> {
  const result = await getRitualSummariesForViewer(supabase, viewerUserId, {
    upcomingOnly: true,
    sort: "scheduled-asc",
  });

  return {
    rituals: result.rituals
      .filter((ritual) => ritual.joinedByMe && !ritual.isCreator)
      .slice(0, limit),
    warning: result.warning,
  };
}

export function formatRitualLocationLabel(ritual: Pick<RitualSummary, "city" | "province" | "place">): string {
  const baseLocation = formatLocationLabel({
    city: ritual.city,
    province: ritual.province,
  });

  return ritual.place ? `${ritual.place}, ${baseLocation ?? ritual.province}` : baseLocation ?? ritual.province;
}

export function isSameProvinceTribe(
  tribeProvince: string,
  viewerProvince: string | null | undefined,
): boolean {
  return normalizeProvinceMatchKey(tribeProvince) === normalizeProvinceMatchKey(viewerProvince);
}
