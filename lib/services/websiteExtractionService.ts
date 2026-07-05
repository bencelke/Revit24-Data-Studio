import type {
  WebsiteExtractionInput,
  WebsiteExtractionProvider,
  WebsiteExtractionResult,
} from "@/lib/types/website-discovery";
import type { CreateWebsiteRawInput, WebsiteType } from "@/lib/types/websites";
import { isWebsiteWorkerAvailable, WEBSITE_CONFIG } from "@/lib/config/websites";
import {
  detectBusinessTypeFromText,
  detectSocialLinks,
  normalizeEmails,
  normalizePhones,
  parseDomain,
} from "@/lib/services/websiteDiscoveryService";

const MOCK_TEMPLATES: Array<{ suffix: string; type: WebsiteType; city: string; country: string }> = [
  { suffix: "performance", type: "Performance Shop", city: "Stuttgart", country: "Germany" },
  { suffix: "detailing", type: "Detailer", city: "Munich", country: "Germany" },
  { suffix: "wrap", type: "Wrap Shop", city: "Berlin", country: "Germany" },
  { suffix: "club", type: "Car Club", city: "Frankfurt", country: "Germany" },
  { suffix: "track", type: "Race Track", city: "Nürburg", country: "Germany" },
  { suffix: "parts", type: "Parts Store", city: "Hamburg", country: "Germany" },
];

function buildMockWebsite(input: WebsiteExtractionInput): CreateWebsiteRawInput {
  const domain = parseDomain(input.url);
  const template = MOCK_TEMPLATES.find((item) => domain.includes(item.suffix)) ?? MOCK_TEMPLATES[0];
  const brandName = domain
    .split(".")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const timestamp = new Date().toISOString();

  const sampleText = `
    ${brandName} — ${template.type} in ${template.city}, ${template.country}.
    Contact: info@${domain}, +49 711 1234567
    instagram.com/${domain.split(".")[0]} facebook.com/${domain.split(".")[0]}
    Mon-Fri 9:00-18:00 Sat 10:00-14:00
  `;

  return {
    jobId: input.jobId,
    url: input.url,
    domain,
    title: `${brandName} — ${template.type}`,
    metaDescription: `Official website of ${brandName}, a ${template.type.toLowerCase()} in ${template.city}.`,
    logoUrl: `https://${domain}/logo.png`,
    faviconUrl: `https://${domain}/favicon.ico`,
    publicEmails: normalizeEmails([`info@${domain}`, `contact@${domain}`]),
    publicPhones: normalizePhones(["+49 711 1234567"]),
    address: `${template.city}, ${template.country}`,
    country: template.country,
    state: null,
    city: template.city,
    postalCode: "70173",
    socialLinks: detectSocialLinks(sampleText, input.url),
    contactPage: `${input.url}/contact`,
    aboutPage: `${input.url}/about`,
    privacyPage: `${input.url}/privacy`,
    businessHours: ["Mon-Fri 9:00-18:00", "Sat 10:00-14:00"],
    detectedLanguage: "en",
    detectedBusinessType: detectBusinessTypeFromText(sampleText) ?? template.type,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(template.city)}`,
    status: "extracted",
    source: "website",
    createdAt: timestamp,
  };
}

export class MockWebsiteExtractionProvider implements WebsiteExtractionProvider {
  readonly name = "Mock Public Website Extractor";
  readonly version = "0.1.0-mvp";

  isAvailable(): boolean {
    return true;
  }

  async extract(input: WebsiteExtractionInput): Promise<WebsiteExtractionResult> {
    const data = buildMockWebsite(input);
    return {
      success: true,
      data: { ...data, id: `temp_${data.domain}` },
      error: null,
      mockMode: true,
    };
  }
}

export class LiveWebsiteExtractionProvider implements WebsiteExtractionProvider {
  readonly name = "Public Website Fetch Extractor";
  readonly version = "0.1.0-mvp";

  isAvailable(): boolean {
    return isWebsiteWorkerAvailable();
  }

  async extract(input: WebsiteExtractionInput): Promise<WebsiteExtractionResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        data: null,
        error: "Worker not running",
        mockMode: true,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WEBSITE_CONFIG.extractionTimeoutMs);
      const response = await fetch(input.url, {
        signal: controller.signal,
        headers: { "User-Agent": "Revit24DataStudio/0.1 (public-metadata-only)" },
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      const domain = parseDomain(input.url);
      const timestamp = new Date().toISOString();

      const rawInput: CreateWebsiteRawInput = {
        jobId: input.jobId,
        url: input.url,
        domain,
        title: titleMatch?.[1]?.trim() ?? domain,
        metaDescription: metaMatch?.[1]?.trim() ?? null,
        logoUrl: null,
        faviconUrl: null,
        publicEmails: normalizeEmails([html]),
        publicPhones: normalizePhones([html]),
        address: null,
        country: null,
        state: null,
        city: null,
        postalCode: null,
        socialLinks: detectSocialLinks(html, input.url),
        contactPage: null,
        aboutPage: null,
        privacyPage: null,
        businessHours: [],
        detectedLanguage: html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? "en",
        detectedBusinessType: detectBusinessTypeFromText(html),
        googleMapsUrl: html.match(/maps\.google\.com[^"'\s]+/i)?.[0] ?? null,
        status: "extracted",
        source: "website",
        createdAt: timestamp,
      };

      return {
        success: true,
        data: { ...rawInput, id: `live_${domain}` },
        error: null,
        mockMode: false,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Extraction failed",
        mockMode: false,
      };
    }
  }
}

const providers = new Map<string, WebsiteExtractionProvider>([
  ["mock", new MockWebsiteExtractionProvider()],
  ["live", new LiveWebsiteExtractionProvider()],
]);

export function getWebsiteExtractionProvider(): WebsiteExtractionProvider {
  const live = providers.get("live")!;
  if (live.isAvailable()) return live;
  return providers.get("mock")!;
}

export function registerWebsiteExtractionProvider(
  key: string,
  provider: WebsiteExtractionProvider,
): void {
  providers.set(key, provider);
}

export { buildMockWebsite };
