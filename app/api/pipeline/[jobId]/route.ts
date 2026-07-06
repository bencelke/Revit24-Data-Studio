import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getPipelineJobDetail } from "@/lib/services/pipelineService";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    const detail = await getPipelineJobDetail(jobId);

    if (!detail) {
      return NextResponse.json({ error: "Pipeline job not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load pipeline job.") },
      { status: 500 },
    );
  }
}
