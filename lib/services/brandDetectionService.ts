import type { RawExtractedMetadata } from "@/lib/types/normalization";

const BRAND_KEYWORDS: Record<string, string[]> = {
  BMW: ["bmw", "bimmer", "m power"],
  Mercedes: ["mercedes", "benz", "amg"],
  Audi: ["audi", "quattro", "rs"],
  VW: ["vw", "volkswagen", "gti"],
  Porsche: ["porsche", "911", "gt3"],
  Toyota: ["toyota", "supra", "gr86"],
  Honda: ["honda", "civic", "type r"],
  Nissan: ["nissan", "skyline", "gtr", "silvia"],
  Mazda: ["mazda", "rx7", "mx5", "miata"],
  Ford: ["ford", "mustang", "focus rs"],
  Chevrolet: ["chevrolet", "chevy", "camaro", "corvette"],
  Subaru: ["subaru", "wrx", "sti", "brz"],
};

export function detectVehicleBrands(raw: RawExtractedMetadata): string[] {
  const haystack = [raw.displayName, raw.bio, raw.businessCategory, raw.username]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const brands: string[] = [];
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      brands.push(brand);
    }
  }
  return brands;
}

export function detectSpecialties(raw: RawExtractedMetadata, tags: string[]): string[] {
  const specialtyMap: Record<string, string[]> = {
    Detailing: ["Detailing", "Ceramic"],
    Tuning: ["Tuning", "Dyno"],
    Wrap: ["Wrap"],
    Photography: ["Photography"],
    Events: ["Meet", "Cars & Coffee", "Night Cruise"],
    Track: ["Track", "Drift"],
  };

  const specialties = new Set<string>();
  for (const [specialty, relatedTags] of Object.entries(specialtyMap)) {
    if (relatedTags.some((tag) => tags.includes(tag))) {
      specialties.add(specialty);
    }
  }

  const haystack = [raw.bio, raw.businessCategory].filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes("detail")) specialties.add("Detailing");
  if (haystack.includes("wrap")) specialties.add("Wrap & PPF");
  if (haystack.includes("tune") || haystack.includes("performance")) specialties.add("Performance Tuning");
  if (haystack.includes("photo")) specialties.add("Automotive Media");

  return [...specialties];
}
