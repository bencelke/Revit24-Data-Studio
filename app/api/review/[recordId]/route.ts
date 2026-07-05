import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import {
  getReviewRecordDetail,
  performReviewAction,
} from "@/lib/services/reviewService";
import type { ReviewActionPayload } from "@/lib/types/review";

interface RouteContext {
  params: Promise<{ recordId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { recordId } = await context.params;
    const detail = await getReviewRecordDetail(recordId);

    if (!detail) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load review record.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { recordId } = await context.params;
    const body = (await request.json()) as ReviewActionPayload;

    if (!body.action) {
      return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
    }

    const result = await performReviewAction(recordId, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Review action failed.") },
      { status: 500 },
    );
  }
}
