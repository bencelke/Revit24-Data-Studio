import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { extractAndUpsertSingleProfile } from "@/lib/services/instagramPublicExtractorService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: { username: string; profileUrl: string };
    };

    if (!body.profile?.username || !body.profile?.profileUrl) {
      return NextResponse.json({ error: "Profile username and URL are required." }, { status: 400 });
    }

    const { record, updated } = await extractAndUpsertSingleProfile(body.profile);
    return NextResponse.json({ record, updated });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram extraction failed.") },
      { status: 500 },
    );
  }
}
