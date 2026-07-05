import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import {
  extractInstagramProfileBatch,
  extractSingleInstagramProfile,
} from "@/lib/services/instagramExtractionService";

interface ExtractionRequestBody {
  input?: string;
  inputs?: string[];
  maxBatch?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExtractionRequestBody;

    if (body.inputs && Array.isArray(body.inputs)) {
      const inputs = body.inputs.slice(0, body.maxBatch ?? 10);
      const results = await extractInstagramProfileBatch(inputs);
      return NextResponse.json({ results });
    }

    if (!body.input || typeof body.input !== "string") {
      return NextResponse.json(
        { error: "Missing required field: input or inputs" },
        { status: 400 },
      );
    }

    const result = await extractSingleInstagramProfile(body.input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram extraction failed.") },
      { status: 500 },
    );
  }
}
