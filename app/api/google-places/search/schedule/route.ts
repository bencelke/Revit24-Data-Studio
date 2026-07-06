import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { scheduleGooglePlacesSearchLater } from "@/lib/services/googlePlacesSearchService";
import type { PlacesSearchQuery } from "@/lib/types/google-places";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: PlacesSearchQuery;
      scheduledAt?: string;
    };

    if (!body.query || !body.scheduledAt) {
      return NextResponse.json({ error: "Missing query or scheduledAt" }, { status: 400 });
    }

    const job = await scheduleGooglePlacesSearchLater(body.query, body.scheduledAt);
    return NextResponse.json({ jobId: job.id, job });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to schedule Google Places search.") },
      { status: 500 },
    );
  }
}
