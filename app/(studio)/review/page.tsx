import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ReviewDashboardClient, ReviewPageNav } from "@/components/review";
import { getReviewDashboardData } from "@/lib/services/reviewService";

export const metadata: Metadata = {
  title: "Review Queue",
};

export default async function ReviewPage() {
  const data = await getReviewDashboardData();

  return (
    <AppShell
      title="Review Center"
      description="Moderate imported records before they become live in ShiftIt"
    >
      <div className="space-y-6">
        <ReviewPageNav active="queue" />
        <ReviewDashboardClient
          stats={data.stats}
          initialRecords={data.records}
          recentActivity={data.recentActivity}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
