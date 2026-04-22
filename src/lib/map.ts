import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById } from "@/lib/auth";
import { formatLocationLabel, resolveItalianLocation } from "@/lib/location";
import {
  getRitualColorTheme,
  getRitualSummariesForViewer,
  type RitualColorTheme,
  type RitualSummary,
} from "@/lib/rituals";
import type { Database } from "@/types/database";

export type RitualMapPassion = {
  slug: string;
  name: string;
  color: RitualColorTheme;
};

export type RitualMapItem = RitualSummary;

export type RitualMapData = {
  locationStatus: "ready" | "missing-city" | "missing-province";
  viewerLocationLabel: string | null;
  viewerProvince: string | null;
  passions: RitualMapPassion[];
  rituals: RitualMapItem[];
  tribeCount: number;
  warning: string | null;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
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

export async function getTribalRitualMapData(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
): Promise<RitualMapData> {
  const [viewerProfile, viewerPassionsResult] = await Promise.all([
    getProfileById(supabase, currentUserId),
    supabase.from("user_passions").select("passion_slug").eq("user_id", currentUserId),
  ]);

  if (viewerPassionsResult.error) {
    throw viewerPassionsResult.error;
  }

  const viewerPassionSlugs = unique(
    (viewerPassionsResult.data ?? []).map((row) => row.passion_slug),
  );
  const viewerPassionNameMap = await getPassionNameMap(supabase, viewerPassionSlugs);
  const passions: RitualMapPassion[] = viewerPassionSlugs.map((slug) => ({
    slug,
    name: viewerPassionNameMap.get(slug) ?? slug,
    color: getRitualColorTheme(slug),
  }));

  const viewerResolvedLocation = resolveItalianLocation({
    city: viewerProfile?.city ?? null,
    province: viewerProfile?.province ?? null,
  });
  const viewerProvince = viewerProfile?.province ?? viewerResolvedLocation.location.province;
  const viewerLocationLabel = viewerProfile
    ? formatLocationLabel({
        city: viewerProfile.city ?? viewerResolvedLocation.location.city,
        province: viewerProvince,
      })
    : null;

  const locationStatus: RitualMapData["locationStatus"] = !viewerProfile?.city
    ? "missing-city"
    : viewerProvince
      ? "ready"
      : "missing-province";

  if (!viewerProfile || viewerPassionSlugs.length === 0 || locationStatus !== "ready") {
    return {
      locationStatus,
      viewerLocationLabel,
      viewerProvince,
      passions,
      rituals: [],
      tribeCount: 0,
      warning: null,
    };
  }

  let ritualResult: Awaited<ReturnType<typeof getRitualSummariesForViewer>>;
  try {
    ritualResult = await getRitualSummariesForViewer(supabase, currentUserId, {
      upcomingOnly: true,
      sort: "scheduled-asc",
    });
  } catch {
    return {
      locationStatus,
      viewerLocationLabel,
      viewerProvince,
      passions,
      rituals: [],
      tribeCount: 0,
      warning:
        "I rituali delle tue tribu non sono disponibili in questo momento. Controlla che le migration rituali siano state applicate.",
    };
  }

  return {
    locationStatus,
    viewerLocationLabel,
    viewerProvince,
    passions,
    rituals: ritualResult.rituals,
    tribeCount: ritualResult.tribes.length,
    warning: ritualResult.warning,
  };
}
