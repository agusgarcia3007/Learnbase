import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { env } from "./env";

const customDomainCorsCache = new Map<string, boolean>();

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  if (env.CORS_ORIGIN) {
    if (env.CORS_ORIGIN.includes("*")) {
      const pattern = env.CORS_ORIGIN.replace(/\*/g, "[a-z0-9-]+");
      const regex = new RegExp(`^https?://${pattern}$`);
      if (regex.test(origin)) return true;

      const baseDomain = env.CORS_ORIGIN.replace(/^\*\./, "");
      const baseRegex = new RegExp(`^https?://${baseDomain.replace(/\./g, "\\.")}$`);
      if (baseRegex.test(origin)) return true;
    } else if (origin === env.CORS_ORIGIN) {
      return true;
    }
  }

  const url = new URL(origin);
  const hostname = url.hostname;

  if (customDomainCorsCache.has(hostname)) {
    return customDomainCorsCache.get(hostname)!;
  }

  db.select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.customDomain, hostname))
    .limit(1)
    .then(([tenant]) => {
      customDomainCorsCache.set(hostname, !!tenant);
      setTimeout(() => customDomainCorsCache.delete(hostname), 5 * 60 * 1000);
    });

  return true;
}
