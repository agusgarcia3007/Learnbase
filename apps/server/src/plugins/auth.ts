import { Elysia } from "elysia";
import { jwtPlugin } from "./jwt";
import { tenantPlugin } from "./tenant";
import { db } from "@/db";
import { usersTable, type SelectUser, type UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Cache } from "@/lib/cache";

export type UserWithoutPassword = Omit<SelectUser, "password">;

const USER_CACHE_TTL = 60 * 1000;
const userCache = new Cache<UserWithoutPassword>(USER_CACHE_TTL);

export function invalidateUserCache(userId: string): void {
  userCache.delete(userId);
}

async function findUser(userId: string): Promise<UserWithoutPassword | null> {
  const cached = userCache.get(userId);
  if (cached) return cached;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  userCache.set(userId, userWithoutPassword);
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

    // Tenant check
    // - Superadmin bypasses always
    // - Owner without tenant (tenantId null) bypasses
    // - Owner with tenant must match
    // - Student/Admin must match
    const bypassesTenantCheck =
      user.role === "superadmin" ||
      (user.role === "owner" && user.tenantId === null);

    if (!bypassesTenantCheck && tenant && tenant.id !== user.tenantId) {
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
