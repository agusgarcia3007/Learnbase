import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { env } from "./lib/env";
import { errorHandler } from "./lib/errors";
import { logger } from "./lib/logger";
import { parseDuration } from "./lib/utils";
import { ROUTES } from "./routes";
import { db } from "./db";
import { tenantsTable } from "./db/schema";
import { eq } from "drizzle-orm";

const customDomainCorsCache = new Map<string, boolean>();

function isAllowedOriginSync(origin: string | undefined): boolean | null {
  if (!origin) return true;

  if (env.CORS_ORIGIN) {
    if (env.CORS_ORIGIN.includes("*")) {
      const pattern = env.CORS_ORIGIN.replace(/\*/g, "[a-z0-9-]+");
      const regex = new RegExp(`^https?://${pattern}$`);
      if (regex.test(origin)) return true;
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

    db.select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.customDomain, hostname))
      .limit(1)
      .then(([tenant]) => {
        customDomainCorsCache.set(hostname, !!tenant);
        setTimeout(() => customDomainCorsCache.delete(hostname), 5 * 60 * 1000);
      });

    return true;
  } catch {
    return true;
  }
}

const app = new Elysia()
  .use(errorHandler)
  .use(cors({ origin: (ctx) => isAllowedOriginSync(ctx.headers.get("origin") ?? undefined) ?? true }))
  .use(rateLimit({ max: 100, duration: 60_000 }))
  .use(
    openapi({
      documentation: {
        info: {
          title: "LMS API",
          version: "1.0.0",
          description: "Multi-tenant Learning Management System API",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Profile", description: "User profile management" },
          {
            name: "Tenants",
            description: "Tenant management (superadmin only)",
          },
        ],
      },
    })
  )
  .derive(() => ({ startTime: performance.now() }))
  .onAfterResponse(({ request, startTime, set }) => {
    const duration = (performance.now() - startTime).toFixed(2);
    const statusCode = set.status;

    logger.info(`${request.method} ${request.url} ${parseDuration(+duration)} ${statusCode}`);
  })
  .get("/", () => ({ message: "LMS API", version: "1.0.0" }));

ROUTES.forEach(({ path, route }) => {
  app.group(path, (app) => app.use(route));
});

app.listen(env.PORT);

logger.info(`LMS API running at ${app.server?.hostname}:${app.server?.port}`);
