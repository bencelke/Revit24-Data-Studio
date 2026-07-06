import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { createCampaign, getCampaignListResult } from "@/lib/services/campaignService";
import type { CreateCampaignPayload } from "@/lib/types/discovery-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const list = await getCampaignListResult(page, pageSize);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load campaigns.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCampaignPayload;
    if (!body.name || !body.provider || !body.entityTypes?.length) {
      return NextResponse.json(
        { error: "Missing required fields: name, provider, entityTypes" },
        { status: 400 },
      );
    }
    const campaign = await createCampaign(body);
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create campaign.") },
      { status: 500 },
    );
  }
}
