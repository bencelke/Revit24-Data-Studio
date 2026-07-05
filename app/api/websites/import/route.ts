import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { importSelectedWebsites } from "@/lib/services/websiteImportService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      websiteIds?: string[];
      action?: "import" | "queue" | "reject" | "duplicate";
    };

    if (!body.websiteIds || !Array.isArray(body.websiteIds)) {
      return NextResponse.json({ error: "Missing websiteIds" }, { status: 400 });
    }

    const result = await importSelectedWebsites(body.websiteIds, body.action ?? "import");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Website import failed.") },
      { status: 500 },
    );
  }
}
