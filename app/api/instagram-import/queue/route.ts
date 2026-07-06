import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { uploadToRevit24ImportQueue } from "@/lib/services/simpleInstagramImportService";
import type { SimpleExtractedProfile } from "@/lib/types/simpleInstagramImport";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      records?: SimpleExtractedProfile[];
    };

    if (!body.records?.length) {
      return NextResponse.json({ error: "No records provided." }, { status: 400 });
    }

    const result = await uploadToRevit24ImportQueue(body.records);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to upload to Revit24.") },
      { status: 500 },
    );
  }
}
