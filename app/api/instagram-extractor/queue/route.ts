import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { enqueueInstagramProfiles } from "@/lib/services/instagramExtractionQueueService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profiles?: { username: string; profileUrl: string }[];
    };

    if (!body.profiles?.length) {
      return NextResponse.json({ error: "No profiles provided." }, { status: 400 });
    }

    const result = await enqueueInstagramProfiles(body.profiles);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to queue Instagram profiles.") },
      { status: 500 },
    );
  }
}
