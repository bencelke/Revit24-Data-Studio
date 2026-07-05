import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Platform configuration, roles, and integrations"
    >
      <PlaceholderPage
        title="Platform Settings"
        description="Future home for Firebase configuration, role management, and integration settings."
      />
    </AppShell>
  );
}
