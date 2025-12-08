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

app.listen(env.PORT);

logger.info(
  `📚 Learnbase API running at ${app.server?.hostname}:${app.server?.port}`
);
