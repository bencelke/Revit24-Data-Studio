"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems } from "./nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href="/instagram-import"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
            R24
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none text-foreground">
              Revit24
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              Data Studio
            </span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-brand" : "text-muted-foreground",
                  )}
                />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Instagram import tool</p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          Revit24 Data Studio
        </p>
      </div>
    </aside>
  );
}
