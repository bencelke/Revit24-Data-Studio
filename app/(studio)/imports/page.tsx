import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Imports",
};

export default function ImportsPage() {
  return (
    <AppShell
      title="Imports"
      description="Discover and collect publicly available automotive community data"
    >
      <PlaceholderPage
        title="Import Pipeline"
        description="Future home for Instagram profiles, Google Places businesses, websites, and CSV uploads."
      />
    </AppShell>
  );
}
