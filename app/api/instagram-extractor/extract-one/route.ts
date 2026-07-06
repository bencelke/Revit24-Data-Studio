import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { extractProfileForApi } from "@/lib/services/instagramPublicExtractorService";
import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: string | { username: string; profileUrl: string };
    };

    const profileInput =
      typeof body.profile === "string"
        ? body.profile
        : body.profile?.username
          ? body.profile.username
          : null;

    if (!profileInput) {
      return NextResponse.json({ error: "Profile input is required." }, { status: 400 });
    }

    const result = await extractProfileForApi(profileInput);

    if (typeof body.profile === "object" && body.profile?.profileUrl) {
      const normalized = normalizeInstagramInput(profileInput);
      if (normalized.profileUrl && result.record.profileUrl !== normalized.profileUrl) {
        result.record.profileUrl = normalized.profileUrl;
      }
    }

    return NextResponse.json(
      {
        record: result.record,
        updated: result.updated,
        ok: result.ok,
        result: result.result,
        error: result.error,
      },
      { status: result.ok ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Instagram extraction failed.") },
      { status: 500 },
    );
  }
}
