import { NextResponse } from "next/server";
import { createInstagramProfileImportJobFromText } from "@/lib/services/instagramProfileImportService";
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

    const result = await createInstagramProfileImportJobFromText(
      body.text,
      body.name,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create import job.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
