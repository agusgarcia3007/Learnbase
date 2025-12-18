import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "uselearnbase.com";

function isOurDomain(hostname: string): boolean {
  return hostname === BASE_DOMAIN || hostname.endsWith(`.${BASE_DOMAIN}`);
}

function getTenantSlugFromHostname(hostname: string): string | null {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (isOurDomain(hostname)) {
    const parts = hostname.split(".");
    if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
      return parts[0];
    }
    return null;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  let tenantSlug = getTenantSlugFromHostname(hostname);

  if (!tenantSlug && process.env.NODE_ENV === "development") {
    tenantSlug = url.searchParams.get("campus");
  }

  const requestHeaders = new Headers(request.headers);

  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  requestHeaders.set("x-pathname", url.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
