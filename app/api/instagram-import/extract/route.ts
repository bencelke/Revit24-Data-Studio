import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runInstagramExtraction } from "@/lib/services/instagramPublicExtractorService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profiles?: { username: string; profileUrl: string }[];
    };

    if (!body.profiles?.length) {
      return NextResponse.json({ error: "No profiles provided." }, { status: 400 });
    }

    const { results, summary } = await runInstagramExtraction(body.profiles);
    return NextResponse.json({ results, summary });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram extraction failed.") },
      { status: 500 },
    );
  }
}
