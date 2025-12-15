import { Elysia, t } from "elysia";
import { authPlugin, invalidateUserCache } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { tenantsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadFileToS3, deleteFromS3, getPresignedUrl } from "@/lib/upload";

export const profileRoutes = new Elysia().use(authPlugin);

/** Convert S3 key to presigned URL in user object */
function withAvatarUrl<T extends { avatar: string | null }>(
  user: T
): T & { avatar: string | null } {
  return {
    ...user,
    avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
  };
}

// Get profile
profileRoutes.get(
  "/",
  async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      let tenant = null;
      if (ctx.user.tenantId) {
        const [found] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.user.tenantId))
          .limit(1);
        tenant = found || null;
      }

      return { user: withAvatarUrl(ctx.user), tenant };
  },
  {
    detail: { tags: ["Profile"], summary: "Get current user profile" },
  }
);

// Update profile (name and locale)
profileRoutes.put(
  "/",
  async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const updateData: { name?: string; locale?: string } = {};
      if (ctx.body.name) updateData.name = ctx.body.name;
      if (ctx.body.locale) updateData.locale = ctx.body.locale;

      const [updated] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, ctx.userId!))
        .returning();

      invalidateUserCache(ctx.userId!);

      const { password: _, ...userWithoutPassword } = updated;
      return { user: withAvatarUrl(userWithoutPassword) };
  },
  {
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1 })),
      locale: t.Optional(t.String()),
    }),
    detail: { tags: ["Profile"], summary: "Update profile" },
  }
);

// Upload avatar
profileRoutes.post(
  "/avatar",
  async (ctx) => {
    if (!ctx.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }

    const [, avatarKey] = await Promise.all([
      ctx.user.avatar ? deleteFromS3(ctx.user.avatar) : Promise.resolve(),
      uploadFileToS3({
        file: ctx.body.avatar,
        folder: "avatars",
        userId: ctx.userId!,
      }),
    ]);

    const [updated] = await db
      .update(usersTable)
      .set({ avatar: avatarKey })
      .where(eq(usersTable.id, ctx.userId!))
      .returning();

    invalidateUserCache(ctx.userId!);

    const { password: _, ...userWithoutPassword } = updated;
    return { user: withAvatarUrl(userWithoutPassword) };
  },
  {
    body: t.Object({
      avatar: t.File({ type: "image", maxSize: "5m" }),
    }),
    detail: { tags: ["Profile"], summary: "Upload avatar" },
  }
);

// Delete avatar
profileRoutes.delete(
  "/avatar",
  async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      // Delete from S3 and update DB in parallel (independent operations)
      const [, [updated]] = await Promise.all([
        ctx.user.avatar ? deleteFromS3(ctx.user.avatar) : Promise.resolve(),
        db
          .update(usersTable)
          .set({ avatar: null })
          .where(eq(usersTable.id, ctx.userId!))
          .returning(),
      ]);

      invalidateUserCache(ctx.userId!);

      const { password: _, ...userWithoutPassword } = updated;
      return { user: withAvatarUrl(userWithoutPassword) };
  },
  {
    detail: { tags: ["Profile"], summary: "Delete avatar" },
  }
);
