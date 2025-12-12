import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable, type SelectTenant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Cache } from "@/lib/cache";
import { env } from "@/lib/env";

const TENANT_CACHE_TTL = 5 * 60 * 1000;
const tenantCache = new Cache<SelectTenant>(TENANT_CACHE_TTL);
const customDomainCache = new Cache<SelectTenant>(TENANT_CACHE_TTL);

export function invalidateTenantCache(slug: string): void {
  tenantCache.delete(slug);
}

export function invalidateCustomDomainCache(domain: string): void {
  customDomainCache.delete(domain);
}

function isLocalhost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function isOurSubdomain(host: string): boolean {
  const hostWithoutPort = host.split(":")[0];
  return hostWithoutPort.endsWith(`.${env.BASE_DOMAIN}`);
}

function extractSlugFromHost(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  if (parts.length < 3) return null;
  return parts[0];
}

async function findTenant(slug: string): Promise<SelectTenant | null> {
  const cached = tenantCache.get(slug);
  if (cached) {
    return cached.status === "active" ? cached : null;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, slug))
    .limit(1);

  if (tenant) {
    tenantCache.set(slug, tenant);
    return tenant.status === "active" ? tenant : null;
  }

  return null;
}

async function findTenantByCustomDomain(
  domain: string
): Promise<SelectTenant | null> {
  const cached = customDomainCache.get(domain);
  if (cached) {
    return cached.status === "active" ? cached : null;
  }

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.customDomain, domain))
    .limit(1);

  if (tenant) {
    customDomainCache.set(domain, tenant);
    return tenant.status === "active" ? tenant : null;
  }

  return null;
}

export const tenantPlugin = new Elysia({ name: "tenant" }).derive(
  { as: "scoped" },
  async ({ headers }): Promise<{ tenant: SelectTenant | null }> => {
    const host = headers["host"] || "";
    const hostWithoutPort = host.split(":")[0];

    const headerSlug = headers["x-tenant-slug"] || null;
    if (headerSlug) {
      const tenant = await findTenant(headerSlug);
      return { tenant };
    }

    if (isLocalhost(host)) {
      return { tenant: null };
    }

    if (isOurSubdomain(host)) {
      const slug = extractSlugFromHost(host);
      if (slug) {
        const tenant = await findTenant(slug);
        return { tenant };
      }
    }

    const tenant = await findTenantByCustomDomain(hostWithoutPort);
    return { tenant };
  }
);
