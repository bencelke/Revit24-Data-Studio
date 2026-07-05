import type { WebsiteRawDocument } from "@/lib/types/websites";
import type { NormalizationResult, RawExtractedMetadata, SocialLinks } from "@/lib/types/normalization";
import {
  normalizeExtractedMetadata,
  runNormalizationPipeline,
} from "@/lib/services/normalizationPipeline";

function mapSocialLinks(links: WebsiteRawDocument["socialLinks"]): SocialLinks {
  return {
    instagram: links.instagram ?? null,
    facebook: links.facebook ?? null,
    tiktok: links.tiktok ?? null,
    youtube: links.youtube ?? null,
    website: links.website ?? null,
    discord: links.discord ?? null,
    telegram: links.telegram ?? null,
  };
}

export function websiteToRaw(website: WebsiteRawDocument): RawExtractedMetadata {
  return {
    source: "website",
    sourceRecordId: website.id,
    displayName: website.title,
    username: website.domain,
    bio: website.metaDescription ?? website.title,
    website: website.url,
    publicEmail: website.publicEmails[0]?.email ?? null,
    publicPhone: website.publicPhones[0]?.phone ?? null,
    profileUrl: website.url,
    businessCategory: website.detectedBusinessType,
    country: website.country,
    city: website.city,
    state: website.state,
    postalCode: website.postalCode,
    address: website.address,
    verified: false,
  };
}

export async function normalizeWebsite(website: WebsiteRawDocument): Promise<NormalizationResult> {
  const result = await runNormalizationPipeline(websiteToRaw(website));
  const socialLinks = mapSocialLinks(website.socialLinks);
  return {
    ...result,
    record: {
      ...result.record,
      socialLinks: { ...result.record.socialLinks, ...socialLinks },
    },
  };
}

export function previewNormalizedWebsite(website: WebsiteRawDocument) {
  return normalizeExtractedMetadata(websiteToRaw(website));
}
