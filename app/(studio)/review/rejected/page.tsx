import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ReviewListClient, ReviewPageNav } from "@/components/review";
import { getReviewRecordsList } from "@/lib/services/reviewService";

export const metadata: Metadata = {
  title: "Rejected Records",
};

export default async function ReviewRejectedPage() {
  const { records, dataMode, firebaseConfigured } = await getReviewRecordsList("rejected");

  return (
    <AppShell
      title="Rejected Records"
      description="Records rejected during moderation — can be reopened"
    >
      <div className="space-y-6">
        <ReviewPageNav active="rejected" />
        <ReviewListClient
          initialRecords={records}
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
          defaultStatus="rejected"
          showStatusFilter={false}
        />
      </div>
    </AppShell>
  );
}
