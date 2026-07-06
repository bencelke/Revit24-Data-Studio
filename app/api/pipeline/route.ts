import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getPipelineDashboardData, getPipelineListResult } from "@/lib/services/pipelineService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    if (searchParams.get("list") === "true") {
      const list = await getPipelineListResult(page, pageSize);
      return NextResponse.json(list);
    }

    const data = await getPipelineDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load pipeline data.") },
      { status: 500 },
    );
  }
}
