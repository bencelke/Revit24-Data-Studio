import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = {
  title: "Queue",
};

export default function QueuePage() {
  return (
    <AppShell
      title="Queue"
      description="Monitor background jobs and processing status"
    >
      <PlaceholderPage
        title="Job Queue"
        description="Future home for async import jobs, sync workers, and pipeline orchestration."
      />
    </AppShell>
  );
}
