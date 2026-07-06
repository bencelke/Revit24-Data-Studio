import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { clearExtractionResults } from "@/lib/services/instagramPublicExtractorService";

export async function DELETE() {
  try {
    const deletedCount = await clearExtractionResults();
    return NextResponse.json({ deletedCount });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to clear extraction results.") },
      { status: 500 },
    );
  }
}
