import type { AutomotiveTag } from "@/lib/types/normalization";
import { AUTOMOTIVE_TAGS } from "@/lib/types/normalization";

const TAG_KEYWORDS: Record<AutomotiveTag, string[]> = {
  BMW: ["bmw", "bimmer", "m power", "m3", "m4", "m5"],
  Mercedes: ["mercedes", "benz", "amg", "c63", "e63"],
  Audi: ["audi", "quattro", "rs3", "rs4", "rs6"],
  VW: ["vw", "volkswagen", "gti", "r32"],
  Porsche: ["porsche", "911", "cayman", "boxster", "gt3"],
  Toyota: ["toyota", "supra", "ae86", "gr86", "gr yaris"],
  Honda: ["honda", "civic", "type r", "s2000", "nsx"],
  JDM: ["jdm", "japanese", "import", "skyline", "silvia"],
  Euro: ["euro", "european", "stance"],
  Muscle: ["muscle", "mustang", "camaro", "charger", "hellcat"],
  Classic: ["classic", "vintage", "restoration", "oldtimer"],
  Drift: ["drift", "drifting", "sideways"],
  Track: ["track", "time attack", "hpde", "circuit", "lap"],
  Tuning: ["tuning", "tuner", "mod", "modified", "build"],
  Wrap: ["wrap", "vinyl wrap", "ppf"],
  Detailing: ["detail", "detailing", "detailer", "wash"],
  Ceramic: ["ceramic", "coating", "ceramic coating"],
  Dyno: ["dyno", "horsepower", "whp", "dynojet"],
  Photography: ["photo", "photography", "photographer", "media"],
  Meet: ["meet", "meeting", "gathering", "cars and coffee"],
  "Cars & Coffee": ["cars and coffee", "cars & coffee", "c&c"],
  "Night Cruise": ["night cruise", "cruise", "rollout"],
};

export function detectTags(text: string): string[] {
  const haystack = text.toLowerCase();
  const detected = new Set<string>();

  for (const tag of AUTOMOTIVE_TAGS) {
    const keywords = TAG_KEYWORDS[tag];
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      detected.add(tag);
    }
  }

  return [...detected];
}

export function mergeTags(...tagLists: string[][]): string[] {
  return [...new Set(tagLists.flat())];
}

export function getTagLabel(tag: string): string {
  return tag;
}
