import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "pending", label: "Pending", href: "/duplicates" },
  { key: "resolved", label: "Resolved", href: "/duplicates/resolved" },
  { key: "ignored", label: "Ignored", href: "/duplicates/ignored" },
] as const;

interface DuplicatesPageNavProps {
  active: (typeof NAV_ITEMS)[number]["key"];
}

export function DuplicatesPageNav({ active }: DuplicatesPageNavProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === item.key
              ? "bg-brand/10 text-brand"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
