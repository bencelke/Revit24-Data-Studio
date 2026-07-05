"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function QueuePageNav({
  active,
}: {
  active: "overview" | "history" | "workers" | "logs";
}) {
  const links = [
    { href: "/queue", label: "Queue", key: "overview" as const },
    { href: "/queue/history", label: "History", key: "history" as const },
    { href: "/workers", label: "Workers", key: "workers" as const },
    { href: "/workers/logs", label: "Worker Logs", key: "logs" as const },
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
