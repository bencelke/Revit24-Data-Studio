import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import { savePlacesSearch } from "@/lib/services/placesSearchService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      query?: import("@/lib/types/google-places").PlacesSearchQuery;
    };

    if (!body.query || !body.name) {
      return NextResponse.json({ error: "Missing name or query" }, { status: 400 });
    }

    const saved = await savePlacesSearch({ name: body.name, query: body.query });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to save search.") },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { getPlacesSearchPageData } = await import("@/lib/services/placesSearchService");
    const data = await getPlacesSearchPageData();
    return NextResponse.json({ savedSearches: data.savedSearches });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load saved searches.") },
      { status: 500 },
    );
  }
}
