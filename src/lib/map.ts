import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById } from "@/lib/auth";
import { formatLocationLabel, resolveItalianLocation } from "@/lib/location";
import {
  getBlockVisibilitySets,
  getHiddenPrivateProfileIds,
} from "@/lib/privacy";
import type { Database } from "@/types/database";

export type MapAreaFilter = "province" | "region" | "all";

export type MapUserMatch = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  commonPassions: {
    slug: string;
    name: string;
  }[];
  overlapCount: number;
  areaRank: 1 | 2 | 3;
};

export type MapCluster = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
  count: number;
};

export type PassionMapData = {
  viewerLocationLabel: string | null;
  viewerProvince: string | null;
  viewerRegion: string | null;
  selectedArea: MapAreaFilter;
  passions: {
    slug: string;
    name: string;
  }[];
  results: MapUserMatch[];
  clusters: MapCluster[];
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function normalizeMapAreaFilter(value: string | undefined): MapAreaFilter {
  if (value === "province" || value === "region") {
    return value;
  }

  return "all";
}

export async function getPassionMapData(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  area: MapAreaFilter,
): Promise<PassionMapData> {
  const [viewerProfile, viewerPassionRowsResponse, blockVisibility, hiddenPrivateProfileIds] = await Promise.all([
    getProfileById(supabase, currentUserId),
    supabase
      .from("user_passions")
      .select("passion_slug")
      .eq("user_id", currentUserId),
    getBlockVisibilitySets(supabase, currentUserId),
    getHiddenPrivateProfileIds(supabase, currentUserId),
  ]);

  if (viewerPassionRowsResponse.error) {
    throw viewerPassionRowsResponse.error;
  }

  const viewerPassionSlugs = (viewerPassionRowsResponse.data ?? []).map((row) => row.passion_slug);

  const hiddenUserIds = new Set([
    ...blockVisibility.blockedByMeIds,
    ...blockVisibility.blockedMeIds,
    ...hiddenPrivateProfileIds,
  ]);

  if (!viewerProfile || viewerPassionSlugs.length === 0) {
    return {
      viewerLocationLabel: viewerProfile ? formatLocationLabel(viewerProfile) : null,
      viewerProvince: viewerProfile?.province ?? null,
      viewerRegion: viewerProfile?.region ?? null,
      selectedArea: area,
      passions: [],
      results: [],
      clusters: [],
    };
  }

  const viewerResolvedLocation = resolveItalianLocation({
    city: viewerProfile.city,
    province: viewerProfile.province,
  });
  const viewerProvince = viewerProfile.province ?? viewerResolvedLocation.location.province;
  const viewerRegion = viewerProfile.region ?? viewerResolvedLocation.location.region;

  const { data: sharedPassionRows, error: sharedPassionError } = await supabase
    .from("user_passions")
    .select("user_id, passion_slug")
    .in("passion_slug", viewerPassionSlugs)
    .neq("user_id", currentUserId);

  if (sharedPassionError) {
    throw sharedPassionError;
  }

  const overlapByUserId = new Map<string, string[]>();
  (sharedPassionRows ?? []).forEach((row) => {
    if (hiddenUserIds.has(row.user_id)) {
      return;
    }

    const currentPassions = overlapByUserId.get(row.user_id) ?? [];
    currentPassions.push(row.passion_slug);
    overlapByUserId.set(row.user_id, currentPassions);
  });

  const candidateIds = Array.from(overlapByUserId.keys());
  if (candidateIds.length === 0) {
    return {
      viewerLocationLabel: formatLocationLabel(viewerProfile),
      viewerProvince,
      viewerRegion,
      selectedArea: area,
      passions: [],
      results: [],
      clusters: [],
    };
  }

  const [{ data: userRows, error: usersError }, { data: passionRows, error: passionsError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, username, display_name, avatar_url, city, province, region, latitude, longitude")
        .in("id", candidateIds),
      supabase
        .from("passions")
        .select("slug, name")
        .in("slug", viewerPassionSlugs),
    ]);

  if (usersError) {
    throw usersError;
  }
  if (passionsError) {
    throw passionsError;
  }

  const passionNameBySlug = new Map((passionRows ?? []).map((row) => [row.slug, row.name]));
  const mapResults: MapUserMatch[] = (userRows ?? [])
    .map((userRow) => {
      const overlapSlugs = unique(overlapByUserId.get(userRow.id) ?? []);
      const resolvedLocation = resolveItalianLocation({
        city: userRow.city,
        province: userRow.province,
      });
      const province = userRow.province ?? resolvedLocation.location.province;
      const region = userRow.region ?? resolvedLocation.location.region;
      const latitude = userRow.latitude ?? resolvedLocation.location.latitude;
      const longitude = userRow.longitude ?? resolvedLocation.location.longitude;

      const sameProvince = Boolean(viewerProvince && province && viewerProvince === province);
      const sameRegion = Boolean(viewerRegion && region && viewerRegion === region);
      const areaRank: 1 | 2 | 3 = sameProvince ? 1 : sameRegion ? 2 : 3;

      return {
        userId: userRow.id,
        username: userRow.username,
        displayName: userRow.display_name,
        avatarUrl: userRow.avatar_url,
        city: userRow.city ?? resolvedLocation.location.city,
        province,
        region,
        latitude,
        longitude,
        commonPassions: overlapSlugs.map((slug) => ({
          slug,
          name: passionNameBySlug.get(slug) ?? slug,
        })),
        overlapCount: overlapSlugs.length,
        areaRank,
      };
    })
    .filter((result) => {
      if (area === "province") {
        return result.areaRank === 1;
      }
      if (area === "region") {
        return result.areaRank <= 2;
      }
      return true;
    })
    .sort((firstResult, secondResult) => {
      if (firstResult.areaRank !== secondResult.areaRank) {
        return firstResult.areaRank - secondResult.areaRank;
      }
      if (firstResult.overlapCount !== secondResult.overlapCount) {
        return secondResult.overlapCount - firstResult.overlapCount;
      }
      return firstResult.displayName.localeCompare(secondResult.displayName, "it");
    });

  const clustersMap = new Map<string, MapCluster>();
  mapResults.forEach((result) => {
    if (result.latitude === null || result.longitude === null) {
      return;
    }

    const clusterKey = result.province ?? result.region ?? result.userId;
    const clusterLabel = result.province ?? result.region ?? result.displayName;
    const currentCluster = clustersMap.get(clusterKey);

    if (currentCluster) {
      currentCluster.count += 1;
      return;
    }

    clustersMap.set(clusterKey, {
      key: clusterKey,
      label: clusterLabel,
      latitude: result.latitude,
      longitude: result.longitude,
      count: 1,
    });
  });

  return {
    viewerLocationLabel: formatLocationLabel(viewerProfile),
    viewerProvince,
    viewerRegion,
    selectedArea: area,
    passions: viewerPassionSlugs.map((slug) => ({
      slug,
      name: passionNameBySlug.get(slug) ?? slug,
    })),
    results: mapResults,
    clusters: Array.from(clustersMap.values()),
  };
}
