import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "revit24-data-studio",
    phase: 1,
  });
}
