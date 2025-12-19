import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable, type SelectTenant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { redisCache } from "@/lib/redis-cache";

const TENANT_CACHE_TTL = 300;
const TENANT_KEY_PREFIX = "tenant:";
const TENANT_DOMAIN_KEY_PREFIX = "tenant:domain:";

export function invalidateTenantCache(slug: string): void {
  redisCache.del(`${TENANT_KEY_PREFIX}${slug}`);
}

export function invalidateCustomDomainCache(domain: string): void {
  redisCache.del(`${TENANT_DOMAIN_KEY_PREFIX}${domain}`);
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
  const cacheKey = `${TENANT_KEY_PREFIX}${slug}`;

  const cached = await redisCache.get<SelectTenant>(cacheKey);
  if (cached) return cached.status === "active" ? cached : null;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, slug))
    .limit(1);

  if (tenant) {
    await redisCache.set(cacheKey, tenant, TENANT_CACHE_TTL);
  }

  return tenant?.status === "active" ? tenant : null;
}

async function findTenantByCustomDomain(
  domain: string
): Promise<SelectTenant | null> {
  const cacheKey = `${TENANT_DOMAIN_KEY_PREFIX}${domain}`;

  const cached = await redisCache.get<SelectTenant>(cacheKey);
  if (cached) return cached.status === "active" ? cached : null;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.customDomain, domain))
    .limit(1);

  if (tenant) {
    await redisCache.set(cacheKey, tenant, TENANT_CACHE_TTL);
  }

  return tenant?.status === "active" ? tenant : null;
}

export async function findTenantById(
  id: string
): Promise<SelectTenant | null> {
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, id))
    .limit(1);

  return tenant?.status === "active" ? tenant : null;
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
