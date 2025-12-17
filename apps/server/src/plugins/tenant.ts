import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable, type SelectTenant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

export function invalidateTenantCache(_slug: string): void {
  // No-op: cache removed to avoid sync issues with Stripe webhooks
}

export function invalidateCustomDomainCache(_domain: string): void {
  // No-op: cache removed
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
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, slug))
    .limit(1);

  return tenant?.status === "active" ? tenant : null;
}

async function findTenantByCustomDomain(
  domain: string
): Promise<SelectTenant | null> {
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.customDomain, domain))
    .limit(1);

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

    if (isLocalhost(host)) {
      const headerSlug = headers["x-tenant-slug"] || null;
      if (headerSlug) {
        const tenant = await findTenant(headerSlug);
        return { tenant };
      }
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
