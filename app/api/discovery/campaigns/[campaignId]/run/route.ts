import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runDiscoveryCampaignJob } from "@/lib/services/discoveryService";

interface RouteParams {
  params: Promise<{ campaignId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { campaignId } = await params;
    const job = await runDiscoveryCampaignJob(campaignId);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to run discovery job.") },
      { status: 500 },
    );
  }
}
