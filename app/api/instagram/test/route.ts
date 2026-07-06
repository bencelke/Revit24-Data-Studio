import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { runInstagramTestExtraction } from "@/lib/services/instagramTestExtractionService";

interface TestRequestBody {
  input?: string;
  forceMock?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestRequestBody;

    if (!body.input || typeof body.input !== "string") {
      return NextResponse.json({ error: "Missing required field: input" }, { status: 400 });
    }

    const result = await runInstagramTestExtraction(body.input, {
      forceMock: body.forceMock === true,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram test extraction failed.") },
      { status: 500 },
    );
  }
}
