import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  ListTodo,
  Building2,
  MapPin,
  Globe,
  Copy,
  Settings,
  Workflow,
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
    title: "Pipeline",
    href: "/pipeline",
    icon: Workflow,
    description: "Unified import pipeline",
  },
  {
    title: "Entities",
    href: "/entities",
    icon: Building2,
    description: "Normalized automotive records",
  },
  {
    title: "Duplicates",
    href: "/duplicates",
    icon: Copy,
    description: "Resolve and merge duplicate entities",
  },
  {
    title: "Google Places",
    href: "/google-places",
    icon: MapPin,
    description: "Discover automotive businesses",
  },
  {
    title: "Websites",
    href: "/websites",
    icon: Globe,
    description: "Discover public website metadata",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Platform configuration",
  },
];
