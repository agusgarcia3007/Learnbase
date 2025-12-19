import { Elysia } from "elysia";
import { jwtPlugin } from "./jwt";
import { tenantPlugin } from "./tenant";
import { db } from "@/db";
import { usersTable, type SelectUser, type UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redisCache } from "@/lib/redis-cache";

export type UserWithoutPassword = Omit<SelectUser, "password">;

const USER_CACHE_TTL = 60;
const USER_KEY_PREFIX = "user:";

export function invalidateUserCache(userId: string): void {
  redisCache.del(`${USER_KEY_PREFIX}${userId}`);
}

async function findUser(userId: string): Promise<UserWithoutPassword | null> {
  const cacheKey = `${USER_KEY_PREFIX}${userId}`;

  const cached = await redisCache.get<UserWithoutPassword>(cacheKey);
  if (cached) return cached;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  await redisCache.set(cacheKey, userWithoutPassword, USER_CACHE_TTL);
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
        effectiveTenantId: null as string | null,
      };
    }

    const token = authorization.slice(7);
    const payload = await jwt.verify(token);
    if (!payload || typeof payload.sub !== "string") {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
        effectiveTenantId: null as string | null,
      };
    }

    const user = await findUser(payload.sub);
    if (!user) {
      return {
        user: null as UserWithoutPassword | null,
        userId: null as string | null,
        userRole: null as UserRole | null,
        effectiveTenantId: null as string | null,
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
        effectiveTenantId: null as string | null,
      };
    }

    const effectiveTenantId =
      user.role === "superadmin" && tenant ? tenant.id : user.tenantId;

    return {
      user,
      userId: user.id,
      userRole: user.role,
      effectiveTenantId,
    };
  });
