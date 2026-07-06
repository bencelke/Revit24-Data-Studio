import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors/app-errors";
import {
  getDiscoveryDashboardData,
  getDiscoveryJobListResult,
  listDiscoveryTemplates,
} from "@/lib/services/discoveryService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("templates") === "true") {
      const templates = await listDiscoveryTemplates();
      return NextResponse.json({ templates });
    }

    if (searchParams.get("jobs") === "true") {
      const page = Number(searchParams.get("page") ?? "1");
      const list = await getDiscoveryJobListResult(page);
      return NextResponse.json(list);
    }

    const data = await getDiscoveryDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load discovery data.") },
      { status: 500 },
    );
  }
}
