import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STUDIO_ROUTES = ["/instagram-extractor", "/results", "/settings"];

const LEGACY_ROUTE_PREFIXES = [
  "/dashboard",
  "/imports",
  "/discovery",
  "/review",
  "/queue",
  "/pipeline",
  "/entities",
  "/duplicates",
  "/google-places",
  "/websites",
  "/workers",
  "/instagram-import",
  "/instagram/",
  "/profiles",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/instagram-extractor", request.url));
  }

  if (STUDIO_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  if (
    LEGACY_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix),
    )
  ) {
    return NextResponse.redirect(new URL("/instagram-extractor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
