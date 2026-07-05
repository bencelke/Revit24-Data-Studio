import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getQueueJobDetail, performQueueAction } from "@/lib/services/queueService";
import type { QueueActionPayload } from "@/lib/types/queue";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const detail = await getQueueJobDetail(jobId);

    if (!detail) {
      return NextResponse.json({ error: "Extraction job not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load extraction job.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const body = (await request.json()) as QueueActionPayload;

    if (!body.action) {
      return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
    }

    const result = await performQueueAction(jobId, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Queue action failed.") },
      { status: 500 },
    );
  }
}
