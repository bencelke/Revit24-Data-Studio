import type { WebsiteSocialLinks } from "@/lib/types/websites";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  discord: "Discord",
  telegram: "Telegram",
  x: "X",
  pinterest: "Pinterest",
  website: "Website",
};

interface WebsiteSocialLinksProps {
  links: WebsiteSocialLinks;
}

export function WebsiteSocialLinks({ links }: WebsiteSocialLinksProps) {
  const entries = Object.entries(links).filter(([, url]) => Boolean(url));

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No social profiles detected.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {entries.map(([platform, url]) => (
        <li key={platform} className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{PLATFORM_LABELS[platform] ?? platform}</span>
          <a
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-brand hover:underline"
          >
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}
