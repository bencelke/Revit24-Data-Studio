import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { validateCsvImportPreview } from "@/lib/services/csvImportService";
import type { CsvFieldMapping } from "@/lib/types/csv-import";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      content?: string;
      mapping?: CsvFieldMapping;
    };

    if (!body.content || !body.mapping) {
      return NextResponse.json({ error: "Missing content or mapping" }, { status: 400 });
    }

    const result = await validateCsvImportPreview(body.content, body.mapping);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Validation failed.") },
      { status: 500 },
    );
  }
}
