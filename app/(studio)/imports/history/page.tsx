import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ImportHistoryClient, ImportPageNav } from "@/components/imports";
import { getImportHistoryData } from "@/lib/services/instagramProfileImportService";

export const metadata: Metadata = {
  title: "Import History",
};

export default async function ImportHistoryPage() {
  const { jobs, dataMode, firebaseConfigured } = await getImportHistoryData();

  return (
    <AppShell
      title="Import History"
      description="Search, filter, and review all import jobs"
    >
      <div className="space-y-6">
        <ImportPageNav active="history" />
        <ImportHistoryClient
          initialJobs={jobs}
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
