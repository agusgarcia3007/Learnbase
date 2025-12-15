import { Elysia } from "elysia";
import { AppError, ErrorCode } from "@/lib/errors";
import type { UserRole } from "@/db/schema";
import type { UserWithoutPassword } from "./auth";

type AuthContext = {
  user: UserWithoutPassword | null;
  userRole: UserRole | null;
};

export const guardPlugin = new Elysia({ name: "guards" }).macro(
  ({ onBeforeHandle }) => ({
    requireAuth(enabled: boolean = true) {
      if (!enabled) return;
      onBeforeHandle(({ user }: AuthContext) => {
        if (!user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
      });
    },
    requireTenant(enabled: boolean = true) {
      if (!enabled) return;
      onBeforeHandle(({ user }: AuthContext) => {
        if (!user?.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }
      });
    },
    requireRole(roles: UserRole[]) {
      onBeforeHandle(({ userRole }: AuthContext) => {
        if (!userRole || !roles.includes(userRole)) {
          throw new AppError(ErrorCode.FORBIDDEN, "Insufficient permissions", 403);
        }
      });
    },
  })
);
