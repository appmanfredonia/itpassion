import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById } from "@/lib/auth";
import {
  formatLocationLabel,
  normalizeProvinceMatchKey,
  resolveItalianLocation,
} from "@/lib/location";
import {
  getBlockVisibilitySets,
  getHiddenPrivateProfileIds,
} from "@/lib/privacy";
import type { Database } from "@/types/database";

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
};

export type MapCluster = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
  count: number;
};

export type PassionMapData = {
  locationStatus: "ready" | "missing-city" | "missing-province";
  viewerLocationLabel: string | null;
  viewerProvince: string | null;
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

function normalizePassionMatchKey(value: string): string {
  return value.trim().toLowerCase();
}

export async function getPassionMapData(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
): Promise<PassionMapData> {
  const [viewerProfile, viewerPassionRowsResponse, blockVisibility, hiddenPrivateProfileIds] =
    await Promise.all([
      getProfileById(supabase, currentUserId),
      supabase.from("user_passions").select("passion_slug").eq("user_id", currentUserId),
      getBlockVisibilitySets(supabase, currentUserId),
      getHiddenPrivateProfileIds(supabase, currentUserId),
    ]);

  if (viewerPassionRowsResponse.error) {
    throw viewerPassionRowsResponse.error;
  }

  const viewerPassionSlugs = unique(
    (viewerPassionRowsResponse.data ?? []).map((row) => row.passion_slug),
  );

  const hiddenUserIds = new Set([
    ...blockVisibility.blockedByMeIds,
    ...blockVisibility.blockedMeIds,
    ...hiddenPrivateProfileIds,
  ]);

  const viewerResolvedLocation = resolveItalianLocation({
    city: viewerProfile?.city ?? null,
    province: viewerProfile?.province ?? null,
  });

  const viewerProvince = viewerProfile?.province ?? viewerResolvedLocation.location.province;
  const viewerProvinceMatchKey = normalizeProvinceMatchKey(viewerProvince);
  const viewerLocationLabel = viewerProfile
    ? formatLocationLabel({
        city: viewerProfile.city ?? viewerResolvedLocation.location.city,
        province: viewerProvince,
      })
    : null;

  const locationStatus: PassionMapData["locationStatus"] = !viewerProfile?.city
    ? "missing-city"
    : viewerProvinceMatchKey
      ? "ready"
      : "missing-province";

  const passionRowsResponse =
    viewerPassionSlugs.length > 0
      ? await supabase.from("passions").select("slug, name").in("slug", viewerPassionSlugs)
      : { data: [], error: null };

  if (passionRowsResponse.error) {
    throw passionRowsResponse.error;
  }

  const passionNameBySlug = new Map(
    (passionRowsResponse.data ?? []).map((row) => [row.slug, row.name]),
  );
  const viewerPassionKeySet = new Set(
    viewerPassionSlugs.map((slug) => normalizePassionMatchKey(slug)),
  );
  const passions = viewerPassionSlugs.map((slug) => ({
    slug,
    name: passionNameBySlug.get(slug) ?? slug,
  }));

  if (!viewerProfile || viewerPassionSlugs.length === 0 || locationStatus !== "ready") {
    return {
      locationStatus,
      viewerLocationLabel,
      viewerProvince,
      passions,
      results: [],
      clusters: [],
    };
  }

  const { data: userRows, error: usersError } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, city, province, region, latitude, longitude")
    .neq("id", currentUserId);

  if (usersError) {
    throw usersError;
  }

  const sameProvinceUsers = (userRows ?? [])
    .map((userRow) => {
      const resolvedLocation = resolveItalianLocation({
        city: userRow.city,
        province: userRow.province,
      });
      const province = userRow.province ?? resolvedLocation.location.province;
      const region = userRow.region ?? resolvedLocation.location.region;
      const latitude = userRow.latitude ?? resolvedLocation.location.latitude;
      const longitude = userRow.longitude ?? resolvedLocation.location.longitude;

      return {
        ...userRow,
        city: userRow.city ?? resolvedLocation.location.city,
        province,
        provinceMatchKey: normalizeProvinceMatchKey(province),
        region,
        latitude,
        longitude,
      };
    })
    .filter(
      (userRow) =>
        !hiddenUserIds.has(userRow.id) &&
        userRow.provinceMatchKey !== null &&
        userRow.provinceMatchKey === viewerProvinceMatchKey,
    );

  const candidateIds = sameProvinceUsers.map((userRow) => userRow.id);
  if (candidateIds.length === 0) {
    return {
      locationStatus,
      viewerLocationLabel,
      viewerProvince,
      passions,
      results: [],
      clusters: [],
    };
  }

  const { data: candidatePassionRows, error: candidatePassionsError } = await supabase
    .from("user_passions")
    .select("user_id, passion_slug")
    .in("user_id", candidateIds);

  if (candidatePassionsError) {
    throw candidatePassionsError;
  }

  const overlapByUserId = new Map<string, string[]>();
  (candidatePassionRows ?? []).forEach((row) => {
    const normalizedPassionKey = normalizePassionMatchKey(row.passion_slug);
    if (!viewerPassionKeySet.has(normalizedPassionKey)) {
      return;
    }

    const currentPassions = overlapByUserId.get(row.user_id) ?? [];
    currentPassions.push(row.passion_slug.trim());
    overlapByUserId.set(row.user_id, currentPassions);
  });

  const mapResults: MapUserMatch[] = sameProvinceUsers
    .map((userRow) => {
      const overlapSlugs = unique(overlapByUserId.get(userRow.id) ?? []);

      return {
        userId: userRow.id,
        username: userRow.username,
        displayName: userRow.display_name,
        avatarUrl: userRow.avatar_url,
        city: userRow.city,
        province: userRow.province,
        region: userRow.region,
        latitude: userRow.latitude,
        longitude: userRow.longitude,
        commonPassions: overlapSlugs.map((slug) => ({
          slug,
          name: passionNameBySlug.get(slug) ?? slug,
        })),
        overlapCount: overlapSlugs.length,
      };
    })
    .filter((result) => result.commonPassions.length > 0)
    .sort((firstResult, secondResult) => {
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
    locationStatus,
    viewerLocationLabel,
    viewerProvince,
    passions,
    results: mapResults,
    clusters: Array.from(clustersMap.values()),
  };
}
