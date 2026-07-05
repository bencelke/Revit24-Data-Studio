import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ReviewListClient, ReviewPageNav } from "@/components/review";
import { getReviewRecordsList } from "@/lib/services/reviewService";

export const metadata: Metadata = {
  title: "Approved Records",
};

export default async function ReviewApprovedPage() {
  const { records, dataMode, firebaseConfigured } = await getReviewRecordsList("approved");

  return (
    <AppShell
      title="Approved Records"
      description="Records approved for ShiftIt consumption"
    >
      <div className="space-y-6">
        <ReviewPageNav active="approved" />
        <ReviewListClient
          initialRecords={records}
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
          defaultStatus="approved"
          showStatusFilter={false}
        />
      </div>
    </AppShell>
  );
}
