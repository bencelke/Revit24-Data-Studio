import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { importSelectedPlaces } from "@/lib/services/placesImportService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      placeIds?: string[];
      action?: "import" | "queue" | "reject" | "duplicate";
    };

    if (!body.placeIds || !Array.isArray(body.placeIds)) {
      return NextResponse.json({ error: "Missing placeIds" }, { status: 400 });
    }

    const result = await importSelectedPlaces(body.placeIds, body.action ?? "import");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Google Places import failed.") },
      { status: 500 },
    );
  }
}
