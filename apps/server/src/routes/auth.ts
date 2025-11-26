import { Elysia, t } from "elysia"
import { jwtPlugin } from "../plugins/jwt"
import { tenantPlugin } from "../plugins/tenant"
import { db } from "../db"
import { usersTable } from "../db/schema"
import { eq } from "drizzle-orm"

export const authRoutes = new Elysia({ prefix: "/auth", name: "auth-routes" })
  .use(jwtPlugin)
  .use(tenantPlugin)
  .post(
    "/signup",
    async ({ body, jwt, refreshJwt, tenant, set }) => {
      if (!tenant) {
        set.status = 400
        return { message: "Tenant not specified. Use X-Tenant-Slug header." }
      }

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, body.email))
        .limit(1)

      if (existing) {
        set.status = 409
        return { message: "Email already registered" }
      }

      const hashedPassword = await Bun.password.hash(body.password)

      const [user] = await db
        .insert(usersTable)
        .values({
          email: body.email,
          password: hashedPassword,
          name: body.name,
          role: "student",
          tenantId: tenant.id,
        })
        .returning()

      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      })
      const refreshToken = await refreshJwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      })

      const { password: _, ...userWithoutPassword } = user

      return { user: userWithoutPassword, accessToken, refreshToken }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 1 }),
      }),
      detail: { tags: ["Auth"], summary: "Register a new user" },
    }
  )
  .post(
    "/login",
    async ({ body, jwt, refreshJwt, tenant, set }) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, body.email))
        .limit(1)

      if (!user) {
        set.status = 401
        return { message: "Invalid credentials" }
      }

      const isValid = await Bun.password.verify(body.password, user.password)
      if (!isValid) {
        set.status = 401
        return { message: "Invalid credentials" }
      }

      // Tenant check (superadmin bypasses)
      if (user.role !== "superadmin") {
        if (!tenant) {
          set.status = 400
          return { message: "Tenant not specified" }
        }
        if (user.tenantId !== tenant.id) {
          set.status = 403
          return { message: "User does not belong to this tenant" }
        }
      }

      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      })
      const refreshToken = await refreshJwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      })

      const { password: _, ...userWithoutPassword } = user

      return { user: userWithoutPassword, accessToken, refreshToken }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: { tags: ["Auth"], summary: "Login with email and password" },
    }
  )
  .post(
    "/refresh",
    async ({ body, jwt, refreshJwt, set }) => {
      const payload = await refreshJwt.verify(body.refreshToken)

      if (!payload || typeof payload.sub !== "string") {
        set.status = 401
        return { message: "Invalid or expired refresh token" }
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, payload.sub))
        .limit(1)

      if (!user) {
        set.status = 401
        return { message: "User not found" }
      }

      const accessToken = await jwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      })

      return { accessToken }
    },
    {
      body: t.Object({ refreshToken: t.String() }),
      detail: { tags: ["Auth"], summary: "Refresh access token" },
    }
  )
