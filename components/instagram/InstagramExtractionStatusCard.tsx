import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InstagramExtractionDashboardData } from "@/lib/types/instagram-profiles";

interface InstagramExtractionStatusCardProps {
  data: Pick<
    InstagramExtractionDashboardData,
    "extractionEnabled" | "useMock" | "workerStatus" | "firebaseConfigured" | "dataMode"
  >;
}

export function InstagramExtractionStatusCard({ data }: InstagramExtractionStatusCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Worker Status</CardTitle>
        <CardDescription>Public metadata extraction runtime</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant={data.extractionEnabled ? "default" : "outline"}>
          {data.extractionEnabled ? "Extraction Enabled" : "Extraction Disabled"}
        </Badge>
        {data.useMock ? <Badge variant="outline">Mock Mode</Badge> : null}
        <Badge
          variant={
            data.workerStatus === "running"
              ? "default"
              : data.workerStatus === "disabled"
                ? "outline"
                : "secondary"
          }
        >
          Worker: {data.workerStatus}
        </Badge>
        <Badge variant="outline">{data.dataMode}</Badge>
      </CardContent>
    </Card>
  );
}
