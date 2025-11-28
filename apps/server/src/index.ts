import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { env } from "./lib/env";
import { errorHandler } from "./lib/errors";
import { parseDuration } from "./lib/utils";
import { ROUTES } from "./routes";

const app = new Elysia()
  .use(errorHandler)
  .use(cors({ origin: env.CORS_ORIGIN || true }))
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

    console.log(
      `${request.method} ${request.url} ${parseDuration(
        +duration
      )} ${statusCode}`
    );
  })
  .listen(env.PORT);

app.get("/", () => ({ message: "LMS API", version: "1.0.0" }));

ROUTES.forEach(({ path, route }) => {
  app.group(path, (app) => app.use(route));
});

console.log(`LMS API running at ${app.server?.hostname}:${app.server?.port}`);
