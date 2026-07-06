import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { extractSimpleInstagramProfiles } from "@/lib/services/simpleInstagramImportService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profiles?: { username: string; profileUrl: string }[];
    };

    if (!body.profiles?.length) {
      return NextResponse.json({ error: "No profiles provided." }, { status: 400 });
    }

    const results = await extractSimpleInstagramProfiles(body.profiles);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram extraction failed.") },
      { status: 500 },
    );
  }
}
