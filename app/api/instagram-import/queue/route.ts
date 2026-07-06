import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { sendToRevit24ImportQueue } from "@/lib/services/instagramSimpleImportService";
import type { InstagramSimpleExtractedRow } from "@/lib/types/instagramSimpleImport";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      records?: InstagramSimpleExtractedRow[];
    };

    if (!body.records?.length) {
      return NextResponse.json({ error: "No records provided." }, { status: 400 });
    }

    const { records, dataMode } = await sendToRevit24ImportQueue(body.records);
    return NextResponse.json({ queued: records.length, dataMode, records });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to queue records for Revit24.") },
      { status: 500 },
    );
  }
}
