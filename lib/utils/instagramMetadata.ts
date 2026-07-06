const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

export function sanitizeInstagramText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/\u0000/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function extractEmailFromText(text: string | null | undefined): string | null {
  const sanitized = sanitizeInstagramText(text);
  if (!sanitized) return null;
  const match = sanitized.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase() ?? null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'");
}

export function extractMetaContent(
  html: string,
  key: string,
  attr: "property" | "name",
): string | null {
  const patterns = [
    new RegExp(`<meta\\s+${attr}=["']${key}["']\\s+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+${attr}=["']${key}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return sanitizeInstagramText(decodeHtmlEntities(match[1]));
    }
  }

  return null;
}

export function extractProfileImageFromHtml(html: string): string | null {
  const ogImage = extractMetaContent(html, "og:image", "property");
  if (ogImage) return ogImage;

  const twitterImage = extractMetaContent(html, "twitter:image", "name");
  if (twitterImage) return twitterImage;

  const sharedHdMatch = html.match(/"profile_pic_url_hd":"([^"]+)"/);
  if (sharedHdMatch?.[1]) {
    return sanitizeInstagramText(sharedHdMatch[1].replace(/\\u0026/g, "&"));
  }

  const sharedMatch = html.match(/"profile_pic_url":"([^"]+)"/);
  if (sharedMatch?.[1]) {
    return sanitizeInstagramText(sharedMatch[1].replace(/\\u0026/g, "&"));
  }

  return null;
}

/** @deprecated Use extractProfileImageFromHtml */
export function extractProfileImageFromMetadata(html: string): string | null {
  return extractProfileImageFromHtml(html);
}

export function buildMockProfileImageUrl(username: string): string {
  const normalized = username.trim().toLowerCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalized)}&background=1a1a1a&color=ff5a1f&size=128`;
}

export function extractDisplayNameFromMetadata(html: string, username: string): string | null {
  const ogTitle = extractMetaContent(html, "og:title", "property");
  if (ogTitle) {
    const parenMatch = ogTitle.match(/^(.+?)\s*\(@/);
    if (parenMatch?.[1]) return sanitizeInstagramText(parenMatch[1]);

    const pipeMatch = ogTitle.match(/^(.+?)\s*[•|·|-]/);
    if (pipeMatch?.[1]) return sanitizeInstagramText(pipeMatch[1]);

    if (!ogTitle.toLowerCase().includes(username.toLowerCase())) {
      return sanitizeInstagramText(ogTitle);
    }
  }

  const twitterTitle = extractMetaContent(html, "twitter:title", "name");
  if (twitterTitle) {
    const parenMatch = twitterTitle.match(/^(.+?)\s*\(@/);
    if (parenMatch?.[1]) return sanitizeInstagramText(parenMatch[1]);
    return sanitizeInstagramText(twitterTitle);
  }

  const fullNameMatch = html.match(/"full_name":"([^"]*)"/);
  if (fullNameMatch?.[1]) {
    return sanitizeInstagramText(decodeHtmlEntities(fullNameMatch[1]));
  }

  return extractDisplayNameFromJsonLd(html);
}

function extractDisplayNameFromJsonLd(html: string): string | null {
  const jsonLdMatch = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!jsonLdMatch?.[1]) return null;

  try {
    const parsed = JSON.parse(jsonLdMatch[1]) as { name?: string };
    return sanitizeInstagramText(parsed.name);
  } catch {
    return null;
  }
}

export function extractWebsiteFromMetadata(html: string): string | null {
  const externalLink = html.match(/"external_url":"([^"]+)"/);
  if (externalLink?.[1]) {
    return sanitizeInstagramText(decodeHtmlEntities(externalLink[1].replace(/\\u0026/g, "&")));
  }

  const ldJsonWebsite = html.match(/"url":"(https?:\/\/[^"]+)"/);
  if (ldJsonWebsite?.[1] && !ldJsonWebsite[1].includes("instagram.com")) {
    return sanitizeInstagramText(ldJsonWebsite[1]);
  }

  return null;
}

export function extractBioFromMetadata(html: string): string | null {
  const ogDescription = extractMetaContent(html, "og:description", "property");
  if (ogDescription) return ogDescription;

  const twitterDescription = extractMetaContent(html, "twitter:description", "name");
  if (twitterDescription) return twitterDescription;

  const biographyMatch = html.match(/"biography":"([^"]*)"/);
  if (biographyMatch?.[1]) {
    return sanitizeInstagramText(
      decodeHtmlEntities(biographyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')),
    );
  }

  return null;
}
