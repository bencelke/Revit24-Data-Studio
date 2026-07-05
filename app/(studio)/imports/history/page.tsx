import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ImportHistoryClient, ImportPageNav } from "@/components/imports";

export const metadata: Metadata = {
  title: "Import History",
};

export default function ImportHistoryPage() {
  return (
    <AppShell
      title="Import History"
      description="Search, filter, and review all import jobs"
    >
      <div className="space-y-6">
        <ImportPageNav active="history" />
        <ImportHistoryClient />
      </div>
    </AppShell>
  );
}
