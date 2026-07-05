import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import {
  listDuplicateMatches,
} from "@/lib/services/duplicateResolutionService";
import type {
  DuplicateFilterParams,
  EntityMatchStatus,
  MatchReason,
} from "@/lib/types/duplicates";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: DuplicateFilterParams = {
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as EntityMatchStatus | "all") ?? "all",
      confidence: (searchParams.get("confidence") as MatchConfidenceLevel | "all") ?? "all",
      reason: (searchParams.get("reason") as MatchReason | "all") ?? "all",
      page: Number(searchParams.get("page") ?? "1"),
    };

    const result = await listDuplicateMatches(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load duplicate matches.") },
      { status: 500 },
    );
  }
}
