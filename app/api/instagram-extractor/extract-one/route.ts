import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "extraction_disabled_on_vercel",
        message:
          "Direct extraction is disabled on Vercel. Create an extraction job from the UI and run npm run worker:instagram locally.",
        httpStatus: null,
        step: "api_handler",
      },
    },
    { status: 410 },
  );
}
