import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import {
  extractProfileForApi,
  runInstagramExtraction,
} from "@/lib/services/instagramPublicExtractorService";
import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: string;
      profiles?: { username: string; profileUrl: string }[];
    };

    if (typeof body.profile === "string" && body.profile.trim().length > 0) {
      const result = await extractProfileForApi(body.profile);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    }

    if (body.profiles?.length) {
      const { results, summary } = await runInstagramExtraction(body.profiles);
      return NextResponse.json({ results, summary });
    }

    const normalized = typeof body.profile === "string" ? normalizeInstagramInput(body.profile) : null;
    if (normalized?.error) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "invalid_input",
            message: normalized.error,
            httpStatus: null,
            step: "normalize_input",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Profile input is required." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "server_error",
          message: getErrorMessage(error, "Instagram extraction failed."),
          httpStatus: null,
          step: "api_handler",
        },
      },
      { status: 500 },
    );
  }
}
