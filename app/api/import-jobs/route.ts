import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { createImportJobFromText } from "@/lib/services/importJobService";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export async function GET() {
  return NextResponse.json({
    firebaseConfigured: isFirebaseConfigured(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; name?: string };

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 },
      );
    }

    const result = await createImportJobFromText(body.text, body.name);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create import job.") },
      { status: 500 },
    );
  }
}
