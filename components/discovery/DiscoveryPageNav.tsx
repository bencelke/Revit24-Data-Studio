import Link from "next/link";
import { cn } from "@/lib/utils";

const DISCOVERY_NAV = [
  { href: "/discovery", label: "Overview", exact: true },
  { href: "/discovery/new", label: "New Campaign" },
  { href: "/discovery/campaigns", label: "Campaigns" },
  { href: "/discovery/jobs", label: "Jobs" },
  { href: "/discovery/history", label: "History" },
  { href: "/discovery/templates", label: "Templates" },
] as const;

interface DiscoveryPageNavProps {
  active: (typeof DISCOVERY_NAV)[number]["href"];
}

export function DiscoveryPageNav({ active }: DiscoveryPageNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-3">
      {DISCOVERY_NAV.map((item) => {
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-orange-500/10 text-orange-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
