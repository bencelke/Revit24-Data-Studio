import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { parseAndDetectCsv } from "@/lib/services/csvImportService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      content?: string;
      fileName?: string;
      fileSize?: number;
    };

    if (!body.content) {
      return NextResponse.json({ error: "Missing CSV content" }, { status: 400 });
    }

    const { parseResult, mapping, fileError } = parseAndDetectCsv(
      body.content,
      body.fileName ?? "upload.csv",
      body.fileSize ?? body.content.length,
    );

    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    return NextResponse.json({ parseResult, mapping });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to parse CSV.") },
      { status: 500 },
    );
  }
}
