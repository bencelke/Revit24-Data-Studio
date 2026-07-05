import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DuplicateCenterClient, ReviewPageNav } from "@/components/review";
import { getReviewRecordsList } from "@/lib/services/reviewService";

export const metadata: Metadata = {
  title: "Duplicate Center",
};

export default async function ReviewDuplicatesPage() {
  const { records, dataMode, firebaseConfigured } = await getReviewRecordsList("duplicate");

  return (
    <AppShell
      title="Duplicate Center"
      description="Review and resolve potential duplicate records"
    >
      <div className="space-y-6">
        <ReviewPageNav active="duplicates" />
        <DuplicateCenterClient
          initialRecords={records}
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
