import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { clonePlacesSearch } from "@/lib/services/placesSearchService";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const job = await clonePlacesSearch(jobId);
    return NextResponse.json({ jobId: job.id, job });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to clone Google Places search.") },
      { status: 500 },
    );
  }
}
