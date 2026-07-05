import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runInstagramExtractionJob } from "@/lib/services/instagramExtractionService";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { maxRecords?: number };

    const result = await runInstagramExtractionJob(jobId, {
      maxRecords: body.maxRecords,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Extraction job run failed.") },
      { status: 500 },
    );
  }
}
