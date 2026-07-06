import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { listExtractionResults } from "@/lib/services/instagramPublicExtractorService";

export async function GET() {
  try {
    const results = await listExtractionResults();
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load extraction results.") },
      { status: 500 },
    );
  }
}
