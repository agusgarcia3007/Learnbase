import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "@/db";
import { tenantsTable } from "@/db/schema";
import { env } from "./env";

const CACHE_TTL_MS = 5 * 60 * 1000;

const customDomainCache = new Map<string, { valid: boolean; expires: number }>();

const LOCALHOST_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/\[::1\](:\d+)?$/,
];

const ALLOWED_HEADERS_STR =
  "Content-Type, Authorization, X-Tenant-Slug, X-Requested-With, Accept, Origin";
const EXPOSED_HEADERS_STR = "X-Total-Count, X-Total-Pages";
const METHODS_STR = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const MAX_AGE = "86400";

const corsOriginRegex = env.CORS_ORIGIN?.includes("*")
  ? new RegExp(
      `^https?://${env.CORS_ORIGIN.replace(/\*/g, "[a-z0-9-]+")}$`
    )
  : null;

const corsBaseRegex = env.CORS_ORIGIN?.includes("*")
  ? new RegExp(
      `^https?://${env.CORS_ORIGIN.replace(/^\*\./, "").replace(/\./g, "\\.")}$`
    )
  : null;

function isAllowedOriginSync(origin: string): boolean {
  if (LOCALHOST_PATTERNS.some((p) => p.test(origin))) return true;
  if (env.CLIENT_URL && origin === env.CLIENT_URL) return true;
  if (env.CORS_ORIGIN === origin) return true;
  if (corsOriginRegex?.test(origin)) return true;
  if (corsBaseRegex?.test(origin)) return true;
  return false;
}

async function checkCustomDomain(hostname: string): Promise<boolean> {
  const cached = customDomainCache.get(hostname);
  if (cached && cached.expires > Date.now()) {
    return cached.valid;
  }

  try {
    const [tenant] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.customDomain, hostname))
      .limit(1);

    const valid = !!tenant;
    customDomainCache.set(hostname, { valid, expires: Date.now() + CACHE_TTL_MS });
    return valid;
  } catch {
    return false;
  }
}

async function isAllowedOrigin(origin: string): Promise<boolean> {
  if (isAllowedOriginSync(origin)) return true;

  try {
    return await checkCustomDomain(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export const corsPlugin = new Elysia({ name: "custom-cors" }).onRequest(
  async ({ request, set }) => {
    const origin = request.headers.get("origin");
    if (!origin) return;

    const allowed = await isAllowedOrigin(origin);
    if (!allowed) return;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": METHODS_STR,
          "Access-Control-Allow-Headers": ALLOWED_HEADERS_STR,
          "Access-Control-Expose-Headers": EXPOSED_HEADERS_STR,
          "Access-Control-Max-Age": MAX_AGE,
        },
      });
    }

    set.headers["Access-Control-Allow-Origin"] = origin;
    set.headers["Access-Control-Allow-Credentials"] = "true";
    set.headers["Access-Control-Expose-Headers"] = EXPOSED_HEADERS_STR;
  }
);
