import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runPlacesSearch } from "@/lib/services/placesSearchService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: import("@/lib/types/google-places").PlacesSearchQuery };
    if (!body.query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }
    const { job } = await runPlacesSearch(body.query);
    return NextResponse.json({ jobId: job.id, job });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Google Places search failed.") },
      { status: 500 },
    );
  }
}
