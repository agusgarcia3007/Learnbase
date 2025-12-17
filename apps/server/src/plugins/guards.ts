import { Elysia } from "elysia";
import { ErrorCode, type ErrorResponse } from "@/lib/errors";
import type { UserRole } from "@/db/schema";

function errorResponse(
  set: { status?: number | string },
  status: number,
  code: string,
  message: string
): ErrorResponse {
  set.status = status;
  return { code, message };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const guardPlugin = new Elysia({ name: "guards" }).macro({
  requireAuth: {
    beforeHandle(ctx: any) {
      if (!ctx.user) {
        return errorResponse(ctx.set, 401, ErrorCode.UNAUTHORIZED, "Unauthorized");
      }
    },
  },
  requireTenant: {
    beforeHandle(ctx: any) {
      const isSuperadminWithTenant = ctx.userRole === "superadmin" && ctx.tenant;
      if (!ctx.user?.tenantId && !isSuperadminWithTenant) {
        return errorResponse(ctx.set, 404, ErrorCode.TENANT_NOT_FOUND, "User has no tenant");
      }
    },
  },
  requireRole(roles: UserRole[]) {
    return {
      beforeHandle(ctx: any) {
        if (!ctx.userRole || !roles.includes(ctx.userRole)) {
          return errorResponse(ctx.set, 403, ErrorCode.FORBIDDEN, "Insufficient permissions");
        }
      },
    };
  },
  requireTenantAdmin(tenantIdParam: string = "id") {
    return {
      beforeHandle(ctx: any) {
        if (!ctx.user) {
          return errorResponse(ctx.set, 401, ErrorCode.UNAUTHORIZED, "Unauthorized");
        }

        if (ctx.userRole === "superadmin") return;

        const isAdminViewingOwnTenant =
          (ctx.userRole === "owner" || ctx.userRole === "instructor") &&
          ctx.user.tenantId === ctx.params[tenantIdParam];

        if (!isAdminViewingOwnTenant) {
          return errorResponse(ctx.set, 403, ErrorCode.FORBIDDEN, "Access denied");
        }
      },
    };
  },
} as any);
