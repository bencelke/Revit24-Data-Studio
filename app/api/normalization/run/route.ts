import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { normalizeAllCompletedInstagramProfiles } from "@/lib/services/normalizationPipeline";

export async function POST() {
  try {
    const results = await normalizeAllCompletedInstagramProfiles();
    return NextResponse.json({
      processed: results.length,
      results: results.map((result) => ({
        id: result.record.id,
        displayName: result.record.displayName,
        entityType: result.record.entityType,
        confidenceScore: result.record.confidenceScore,
        matchCount: result.matches.length,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Normalization pipeline failed.") },
      { status: 500 },
    );
  }
}
