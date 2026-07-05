import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { createCsvImportJobFromUpload } from "@/lib/services/csvImportService";
import type { CsvFieldMapping } from "@/lib/types/csv-import";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      content?: string;
      fileName?: string;
      fileSize?: number;
      mapping?: CsvFieldMapping;
      notes?: string;
    };

    if (!body.content || !body.mapping || !body.fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createCsvImportJobFromUpload({
      content: body.content,
      fileName: body.fileName,
      fileSize: body.fileSize ?? body.content.length,
      mapping: body.mapping,
      notes: body.notes,
    });

    return NextResponse.json({
      job: result.job,
      importJobId: result.importJobId,
      normalizedCount: result.normalizedCount,
      reviewCount: result.reviewCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "CSV import failed.") },
      { status: 500 },
    );
  }
}
