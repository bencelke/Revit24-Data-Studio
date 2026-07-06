import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getCampaignById } from "@/lib/services/campaignService";
import { getDiscoveryCampaignDetail, runDiscoveryCampaignJob } from "@/lib/services/discoveryService";

interface RouteParams {
  params: Promise<{ campaignId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { campaignId } = await params;
    const detail = await getDiscoveryCampaignDetail(campaignId);
    if (!detail) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load campaign.") },
      { status: 500 },
    );
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { campaignId } = await params;
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    const job = await runDiscoveryCampaignJob(campaignId);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to run discovery job.") },
      { status: 500 },
    );
  }
}
