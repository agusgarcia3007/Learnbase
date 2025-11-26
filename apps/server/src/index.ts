import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import { openapi } from "@elysiajs/openapi";
import { env } from "./lib/env";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { tenantsRoutes } from "./routes/tenants";

const app = new Elysia()
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
  .use(authRoutes)
  .use(profileRoutes)
  .use(tenantsRoutes)
  .get("/", () => ({ message: "LMS API", version: "1.0.0" }))
  .listen(env.PORT);

console.log(`LMS API running at ${app.server?.hostname}:${app.server?.port}`);
