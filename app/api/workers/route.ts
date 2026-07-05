import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { listLiveWorkers } from "@/lib/services/heartbeatService";

export async function GET() {
  try {
    const workers = await listLiveWorkers();
    return NextResponse.json({ workers });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load workers.") },
      { status: 500 },
    );
  }
}
