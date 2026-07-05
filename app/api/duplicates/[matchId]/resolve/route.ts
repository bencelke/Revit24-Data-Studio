import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { performMatchResolution } from "@/lib/services/duplicateResolutionService";
import type { ResolveMatchPayload } from "@/lib/types/duplicates";

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { matchId } = await params;
    const body = (await request.json()) as ResolveMatchPayload;

    if (!body.action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const result = await performMatchResolution(matchId, body);
    if (!result.success) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to resolve match.") },
      { status: 500 },
    );
  }
}
