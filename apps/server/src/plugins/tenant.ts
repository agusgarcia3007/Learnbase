import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable, type SelectTenant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Cache } from "@/lib/cache";

const TENANT_CACHE_TTL = 5 * 60 * 1000;
const tenantCache = new Cache<SelectTenant>(TENANT_CACHE_TTL);

export function invalidateTenantCache(slug: string): void {
  tenantCache.delete(slug);
}

function isLocalhost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function extractSlugFromHost(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  if (parts.length < 3) return null;
  return parts[0];
}

async function findTenant(slug: string): Promise<SelectTenant | null> {
  const cached = tenantCache.get(slug);
  if (cached) return cached;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, slug))
    .limit(1);

  if (tenant) {
    tenantCache.set(slug, tenant);
  }

  return tenant || null;
}

export const tenantPlugin = new Elysia({ name: "tenant" }).derive(
  { as: "scoped" },
  async ({ headers }): Promise<{ tenant: SelectTenant | null }> => {
    const host = headers["host"] || "";
    let slug: string | null = null;

    if (isLocalhost(host)) {
      slug = headers["x-tenant-slug"] || null;
    } else {
      slug = extractSlugFromHost(host);
    }

    if (!slug) {
      return { tenant: null };
    }

    const tenant = await findTenant(slug);
    return { tenant };
  }
);
