import { NextResponse } from "next/server";
import { getFirebaseConfig } from "@/lib/firebase/config";
import { getInstagramQueueErrorMessage } from "@/lib/errors/app-errors";
import { enqueueInstagramProfiles } from "@/lib/services/instagramExtractionQueueService";
import { isFirebaseEnvConfigured } from "@/lib/firebase/firebaseEnv";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isFirebaseEnvConfigured()) {
      return NextResponse.json(
        {
          error:
            "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local and restart the dev server.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      profiles?: { username: string; profileUrl: string }[];
    };

    if (!body.profiles?.length) {
      return NextResponse.json({ error: "No profiles provided." }, { status: 400 });
    }

    const projectId = getFirebaseConfig().projectId;
    console.log("[instagram-extractor/queue] Firebase project:", projectId);
    console.warn(
      "[instagram-extractor/queue] Server route called without Firebase Auth context. Prefer client-side queue writes from /instagram-extractor.",
    );

    const result = await enqueueInstagramProfiles(body.profiles);
    console.log(
      "[instagram-extractor/queue] Queued",
      result.summary.queued,
      "profile(s), skipped",
      result.summary.skipped,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[instagram-extractor/queue] Firestore write failed:", error);
    return NextResponse.json(
      { error: getInstagramQueueErrorMessage(error) },
      { status: 500 },
    );
  }
}
