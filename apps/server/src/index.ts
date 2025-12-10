import "./instrumentation";

import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { getCorsConfig } from "./lib/cors";
import { env } from "./lib/env";
import { errorHandler } from "./lib/errors";
import { logger } from "./lib/logger";
import { parseDuration } from "./lib/utils";
import { ROUTES } from "./routes";

const app = new Elysia()
  .use(errorHandler)
  .use(cors(getCorsConfig()))
  .use(rateLimit({ max: 100, duration: 60_000 }))
  .use(
    openapi({
      documentation: {
        info: {
          title: "Learnbase API",
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

    logger.info(
      `${request.method} ${request.url} ${parseDuration(
        +duration
      )} ${statusCode}`
    );
  })
  .get("/", () => ({ message: "Learnbase API", version: "1.0.0" }));

ROUTES.forEach(({ path, route }) => {
  app.group(path, (app) => app.use(route));
});

app.listen({
  port: env.PORT,
  maxRequestBodySize: 1024 * 1024 * 500,
});

logger.info(
  `📚 Learnbase API running at ${app.server?.hostname}:${app.server?.port}`
);

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);
  app.server?.stop();

  try {
    const { langfuseSpanProcessor, sdk } = await import("./instrumentation");
    await langfuseSpanProcessor.forceFlush();
    await sdk.shutdown();
    logger.info("Langfuse spans flushed");
  } catch (error) {
    logger.error("Shutdown error", { error });
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
