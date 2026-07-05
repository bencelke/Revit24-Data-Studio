import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Review",
};

export default function ReviewPage() {
  return (
    <AppShell
      title="Review"
      description="Classify, verify, and approve records before ShiftIt import"
    >
      <PlaceholderPage
        title="Review Queue"
        description="Future home for record classification, duplicate detection, and admin approval workflows."
      />
    </AppShell>
  );
}
