import italyMunicipalitiesData from "@/data/italy-municipalities.json";

type ItalianMunicipality = {
  city: string;
  province: string;
  provinceCode: string;
  region: string;
};

type ProvinceOption = {
  province: string;
  provinceCode: string;
  region: string;
};

type AreaCoordinates = {
  latitude: number;
  longitude: number;
};

export type UserLocationFields = {
  city: string | null;
  province: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ResolvedItalianLocation = {
  location: UserLocationFields;
  matchedCity: boolean;
  matchedProvince: boolean;
  ambiguousCity: boolean;
};

const italianMunicipalities = italyMunicipalitiesData as ItalianMunicipality[];

const REGION_CENTERS: Record<string, AreaCoordinates> = {
  Abruzzo: { latitude: 42.3512, longitude: 13.3984 },
  Basilicata: { latitude: 40.6404, longitude: 15.8056 },
  Calabria: { latitude: 38.9098, longitude: 16.5877 },
  Campania: { latitude: 40.8518, longitude: 14.2681 },
  "Emilia-Romagna": { latitude: 44.4949, longitude: 11.3426 },
  "Friuli-Venezia Giulia": { latitude: 45.6495, longitude: 13.7768 },
  Lazio: { latitude: 41.9028, longitude: 12.4964 },
  Liguria: { latitude: 44.4056, longitude: 8.9463 },
  Lombardia: { latitude: 45.4642, longitude: 9.19 },
  Marche: { latitude: 43.6158, longitude: 13.5189 },
  Molise: { latitude: 41.561, longitude: 14.668 },
  Piemonte: { latitude: 45.0703, longitude: 7.6869 },
  Puglia: { latitude: 41.1171, longitude: 16.8719 },
  Sardegna: { latitude: 39.2238, longitude: 9.1217 },
  Sicilia: { latitude: 38.1157, longitude: 13.3615 },
  Toscana: { latitude: 43.7696, longitude: 11.2558 },
  "Trentino-Alto Adige/Südtirol": { latitude: 46.4983, longitude: 11.3548 },
  Umbria: { latitude: 43.1107, longitude: 12.3908 },
  "Valle d'Aosta/Vallée d'Aoste": { latitude: 45.737, longitude: 7.3201 },
  Veneto: { latitude: 45.4408, longitude: 12.3155 },
};

function normalizeLocationKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeDisplayValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized.slice(0, 80) : null;
}

const municipalitiesByCityKey = new Map<string, ItalianMunicipality[]>();
const provinceByKey = new Map<string, ProvinceOption>();

for (const municipality of italianMunicipalities) {
  const cityKey = normalizeLocationKey(municipality.city);
  const currentMunicipalities = municipalitiesByCityKey.get(cityKey) ?? [];
  currentMunicipalities.push(municipality);
  municipalitiesByCityKey.set(cityKey, currentMunicipalities);

  const provinceOption = {
    province: municipality.province,
    provinceCode: municipality.provinceCode,
    region: municipality.region,
  };

  const provinceKeys = [
    normalizeLocationKey(municipality.province),
    normalizeLocationKey(municipality.provinceCode),
  ];

  provinceKeys.forEach((key) => {
    if (!provinceByKey.has(key)) {
      provinceByKey.set(key, provinceOption);
    }
  });
}

export const italianProvinceOptions: ProvinceOption[] = Array.from(
  new Map(
    Array.from(provinceByKey.values()).map((provinceOption) => [
      provinceOption.provinceCode,
      provinceOption,
    ]),
  ).values(),
).sort((firstOption, secondOption) => firstOption.province.localeCompare(secondOption.province, "it"));

function resolveRegionCenter(region: string | null): AreaCoordinates | null {
  if (!region) {
    return null;
  }

  return (
    REGION_CENTERS[region] ??
    Object.entries(REGION_CENTERS).find(
      ([key]) => normalizeLocationKey(key) === normalizeLocationKey(region),
    )?.[1] ??
    null
  );
}

export function resolveItalianLocation(input: {
  city: string | null | undefined;
  province: string | null | undefined;
}): ResolvedItalianLocation {
  const normalizedCity = normalizeDisplayValue(input.city);
  const normalizedProvince = normalizeDisplayValue(input.province);

  const provinceMatch = normalizedProvince
    ? provinceByKey.get(normalizeLocationKey(normalizedProvince)) ?? null
    : null;

  if (!normalizedCity) {
    const regionCenter = resolveRegionCenter(provinceMatch?.region ?? null);
    return {
      location: {
        city: null,
        province: provinceMatch?.province ?? null,
        region: provinceMatch?.region ?? null,
        latitude: regionCenter?.latitude ?? null,
        longitude: regionCenter?.longitude ?? null,
      },
      matchedCity: false,
      matchedProvince: Boolean(provinceMatch),
      ambiguousCity: false,
    };
  }

  const cityCandidates = municipalitiesByCityKey.get(normalizeLocationKey(normalizedCity)) ?? [];
  const municipalityMatch =
    cityCandidates.length === 1
      ? cityCandidates[0]
      : provinceMatch
        ? cityCandidates.find(
            (candidate) =>
              candidate.provinceCode === provinceMatch.provinceCode ||
              candidate.province === provinceMatch.province,
          ) ?? null
        : null;

  const resolvedProvince = municipalityMatch
    ? {
        province: municipalityMatch.province,
        provinceCode: municipalityMatch.provinceCode,
        region: municipalityMatch.region,
      }
    : provinceMatch;
  const regionCenter = resolveRegionCenter(resolvedProvince?.region ?? null);

  return {
    location: {
      city: municipalityMatch?.city ?? normalizedCity,
      province: resolvedProvince?.province ?? null,
      region: resolvedProvince?.region ?? null,
      latitude: regionCenter?.latitude ?? null,
      longitude: regionCenter?.longitude ?? null,
    },
    matchedCity: Boolean(municipalityMatch),
    matchedProvince: Boolean(resolvedProvince),
    ambiguousCity: cityCandidates.length > 1 && !municipalityMatch,
  };
}

export function formatLocationLabel(location: Pick<UserLocationFields, "city" | "province">): string | null {
  if (location.city && location.province) {
    return `${location.city}, ${location.province}`;
  }

  return location.city ?? location.province ?? null;
}
