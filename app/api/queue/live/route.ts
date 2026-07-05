import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getLiveQueueProgress } from "@/lib/services/workerRuntimeService";

export async function GET() {
  try {
    const jobs = await getLiveQueueProgress();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load live queue progress.") },
      { status: 500 },
    );
  }
}
