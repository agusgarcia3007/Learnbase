import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { env } from "./env";

const customDomainCorsCache = new Map<string, boolean>();

const LOCALHOST_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/\[::1\](:\d+)?$/,
];

const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Tenant-Slug",
  "X-Requested-With",
  "Accept",
  "Origin",
];

const EXPOSED_HEADERS = ["X-Total-Count", "X-Total-Pages"];

function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_PATTERNS.some((pattern) => pattern.test(origin));
}

function checkAndCacheCustomDomain(hostname: string): void {
  db.select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.customDomain, hostname))
    .limit(1)
    .then(([tenant]) => {
      customDomainCorsCache.set(hostname, !!tenant);
      setTimeout(() => customDomainCorsCache.delete(hostname), 5 * 60 * 1000);
    })
    .catch(() => {
      customDomainCorsCache.set(hostname, false);
    });
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  if (isLocalhostOrigin(origin)) return true;

  if (env.CLIENT_URL && origin === env.CLIENT_URL) return true;

  if (env.CORS_ORIGIN) {
    if (env.CORS_ORIGIN.includes("*")) {
      const pattern = env.CORS_ORIGIN.replace(/\*/g, "[a-z0-9-]+");
      const regex = new RegExp(`^https?://${pattern}$`);
      if (regex.test(origin)) return true;

      const baseDomain = env.CORS_ORIGIN.replace(/^\*\./, "");
      const baseRegex = new RegExp(
        `^https?://${baseDomain.replace(/\./g, "\\.")}$`
      );
      if (baseRegex.test(origin)) return true;
    } else if (origin === env.CORS_ORIGIN) {
      return true;
    }
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (customDomainCorsCache.has(hostname)) {
      return customDomainCorsCache.get(hostname)!;
    }

    checkAndCacheCustomDomain(hostname);
    return true;
  } catch {
    return false;
  }
}

export function getCorsConfig() {
  return {
    origin: (ctx: Request) =>
      isAllowedOrigin(ctx.headers.get("origin") ?? undefined),
    credentials: true,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86400,
  };
}
