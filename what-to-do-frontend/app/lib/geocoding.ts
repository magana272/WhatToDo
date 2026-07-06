export type GeoPlace = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
};

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchPlaces(
  query: string,
  options?: { count?: number; signal?: AbortSignal },
): Promise<GeoPlace[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: String(options?.count ?? 6),
    language: "en",
    format: "json",
  });

  const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const data: { results?: GeoPlace[] } = await response.json();

  return data.results ?? [];
}

export function formatPlace(place: GeoPlace): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

export function pickMatch(results: GeoPlace[], text: string): GeoPlace | null {
  const lower = text.trim().toLowerCase();

  if (!lower) {
    return null;
  }

  return (
    results.find((place) => place.name.toLowerCase() === lower) ??
    results.find((place) => formatPlace(place).toLowerCase() === lower) ??
    results.find((place) => place.name.toLowerCase().startsWith(lower)) ??
    null
  );
}