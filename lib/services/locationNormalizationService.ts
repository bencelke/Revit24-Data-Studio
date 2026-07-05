const CITY_PATTERNS = [
  /\b(?:in|from|based in|located in)\s+([A-Z][a-zA-Z\s]+?)(?:,|\s|$)/,
  /\b([A-Z][a-zA-Z]+),\s*([A-Z]{2})\b/,
  /\b([A-Z][a-zA-Z]+),\s*(Germany|USA|UK|Canada|Australia)\b/i,
];

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  uk: "United Kingdom",
  de: "Germany",
  germany: "Germany",
};

export function normalizeLocationFromText(text: string | null | undefined): {
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
} {
  if (!text?.trim()) {
    return { country: null, state: null, city: null, area: null };
  }

  for (const pattern of CITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (match[2] && match[2].length === 2) {
        return {
          city: match[1]?.trim() ?? null,
          state: match[2].trim(),
          country: "United States",
          area: null,
        };
      }
      if (match[2]) {
        return {
          city: match[1]?.trim() ?? null,
          country: COUNTRY_ALIASES[match[2].toLowerCase()] ?? match[2].trim(),
          state: null,
          area: null,
        };
      }
      return { city: match[1]?.trim() ?? null, state: null, country: null, area: null };
    }
  }

  if (text.toLowerCase().includes("germany") || text.toLowerCase().includes("deutschland")) {
    return { country: "Germany", state: null, city: null, area: null };
  }

  return { country: null, state: null, city: null, area: null };
}

export function normalizeLocation(
  bio: string | null | undefined,
  existingCountry?: string | null,
  existingCity?: string | null,
) {
  const fromBio = normalizeLocationFromText(bio);
  return {
    country: existingCountry ?? fromBio.country,
    state: fromBio.state,
    city: existingCity ?? fromBio.city,
    area: fromBio.area,
    address: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
  };
}
