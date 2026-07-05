"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ReviewPageNav({
  active,
}: {
  active: "queue" | "duplicates" | "approved" | "rejected";
}) {
  const links = [
    { href: "/review", label: "Review Queue", key: "queue" as const },
    { href: "/review/duplicates", label: "Duplicates", key: "duplicates" as const },
    { href: "/review/approved", label: "Approved", key: "approved" as const },
    { href: "/review/rejected", label: "Rejected", key: "rejected" as const },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => (
        <Button
          key={link.key}
          variant={active === link.key ? "secondary" : "ghost"}
          size="sm"
          nativeButton={false}
          render={<Link href={link.href} />}
        >
          {link.label}
        </Button>
      ))}
    </nav>
  );
}
