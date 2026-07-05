import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runWorkerRuntimeCycle } from "@/lib/services/workerRuntimeService";

export async function POST() {
  try {
    const result = await runWorkerRuntimeCycle();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Worker runtime cycle failed.") },
      { status: 500 },
    );
  }
}
