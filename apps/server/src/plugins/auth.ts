import { Elysia } from "elysia";
import { jwtPlugin } from "./jwt";
import { tenantPlugin } from "./tenant";
import { db } from "@/db";
import { usersTable, type SelectUser, type UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserWithoutPassword = Omit<SelectUser, "password">;

async function findUser(userId: string): Promise<UserWithoutPassword | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Base auth plugin that extracts user from token
export const authPlugin = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  .use(tenantPlugin)
  .derive({ as: "scoped" }, async ({ headers, jwt, tenant }) => {
    const authorization = headers["authorization"];
    if (!authorization?.startsWith("Bearer ")) {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
      };
    }

    const token = authorization.slice(7);
    const payload = await jwt.verify(token);
    if (!payload || typeof payload.sub !== "string") {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
      };
    }

    const user = await findUser(payload.sub);
    if (!user) {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
      };
    }

    // Tenant check (superadmin bypasses)
    if (user.role !== "superadmin" && tenant && tenant.id !== user.tenantId) {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
      };
    }

    return {
      user,
      userId: user.id,
      userRole: user.role,
    };
  });
