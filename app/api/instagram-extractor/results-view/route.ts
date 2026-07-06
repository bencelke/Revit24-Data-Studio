import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { getInstagramResultsView } from "@/lib/services/instagramExtractionQueueService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const view = await getInstagramResultsView();
    return NextResponse.json(view);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load results view.") },
      { status: 500 },
    );
  }
}
