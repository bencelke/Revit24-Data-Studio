import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  ListTodo,
  Building2,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/lib/types";

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and activity",
  },
  {
    title: "Imports",
    href: "/imports",
    icon: Upload,
    description: "Manage data imports",
  },
  {
    title: "Review",
    href: "/review",
    icon: ClipboardCheck,
    description: "Review and approve records",
  },
  {
    title: "Queue",
    href: "/queue",
    icon: ListTodo,
    description: "Background job queue",
  },
  {
    title: "Entities",
    href: "/entities",
    icon: Building2,
    description: "Normalized automotive records",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Platform configuration",
  },
];
