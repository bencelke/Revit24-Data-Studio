import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { deleteExtractionResult } from "@/lib/services/instagramPublicExtractorService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteExtractionResult(id);

    if (!deleted) {
      return NextResponse.json({ error: "Result not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to delete extraction result.") },
      { status: 500 },
    );
  }
}
