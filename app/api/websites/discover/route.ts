import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { createWebsiteDiscoveryJob } from "@/lib/services/websiteDiscoveryService";
import type { WebsiteDiscoveryInput } from "@/lib/types/website-discovery";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<WebsiteDiscoveryInput>;

    if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json({ error: "Missing urls" }, { status: 400 });
    }

    const input: WebsiteDiscoveryInput = {
      inputType: body.inputType ?? "bulk",
      urls: body.urls,
      respectRobotsTxt: body.respectRobotsTxt ?? true,
    };

    const result = await createWebsiteDiscoveryJob(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Website discovery failed.") },
      { status: 500 },
    );
  }
}
