import { cache } from "react";
import { headers } from "next/headers";
import { fetchTenantBySlug, fetchTenantByCustomDomain } from "./api";
import type { Tenant } from "./types";

const BASE_DOMAINS = (process.env.NEXT_PUBLIC_BASE_DOMAINS || "localhost")
  .split(",")
  .map((d) => d.trim());
const RESERVED_SUBDOMAINS = ["www", "api", "admin", "app"];

function extractSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0];

  if (hostname.endsWith(".localhost")) {
    return hostname.split(".")[0];
  }

  for (const baseDomain of BASE_DOMAINS) {
    if (hostname.endsWith(`.${baseDomain}`)) {
      const parts = hostname.split(".");
      if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
        return parts[0];
      }
    }
  }

  return null;
}

function isOurSubdomain(hostname: string): boolean {
  if (hostname.endsWith(".localhost")) return true;
  return BASE_DOMAINS.some((domain) => hostname.endsWith(`.${domain}`));
}

async function fetchTenant(): Promise<Tenant | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const hostname = host.split(":")[0];

  const slug = extractSlugFromHost(host);

  if (slug) {
    return fetchTenantBySlug(slug);
  }

  if (hostname && hostname !== "localhost" && !isOurSubdomain(hostname)) {
    return fetchTenantByCustomDomain(hostname);
  }

  return null;
}

export const getTenant = cache(fetchTenant);
