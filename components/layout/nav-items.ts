import {
  AtSign,
  ClipboardList,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/lib/types";

/** Simplified app navigation — only the 3 primary screens. */
export const mainNavItems: NavItem[] = [
  {
    title: "Instagram Import",
    href: "/instagram-import",
    icon: AtSign,
    description: "Paste profiles and extract public metadata",
  },
  {
    title: "Results",
    href: "/results",
    icon: ClipboardList,
    description: "Review extracted profiles and upload to Revit24",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App configuration",
  },
];

/** Legacy routes remain accessible by URL but hidden from sidebar. */
export const legacyNavItems: NavItem[] = [];
