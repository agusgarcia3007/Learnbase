import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { tenantsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadBase64ToS3, deleteFromS3, getPresignedUrl } from "@/lib/upload";

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
  (ctx) =>
    withHandler(ctx, async () => {
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
    }),
  {
    detail: { tags: ["Profile"], summary: "Get current user profile" },
  }
);

// Update profile (name only)
profileRoutes.put(
  "/",
  (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const [updated] = await db
        .update(usersTable)
        .set({ name: ctx.body.name })
        .where(eq(usersTable.id, ctx.userId!))
        .returning();

      const { password: _, ...userWithoutPassword } = updated;
      return { user: withAvatarUrl(userWithoutPassword) };
    }),
  {
    body: t.Object({
      name: t.String({ minLength: 1 }),
    }),
    detail: { tags: ["Profile"], summary: "Update profile name" },
  }
);

// Upload avatar
profileRoutes.post(
  "/avatar",
  (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (!ctx.body.avatar.startsWith("data:image/")) {
        throw new AppError(ErrorCode.BAD_REQUEST, "Avatar must be an image", 400);
      }

      // Delete old avatar and upload new one in parallel (different files)
      const [, avatarKey] = await Promise.all([
        ctx.user.avatar ? deleteFromS3(ctx.user.avatar) : Promise.resolve(),
        uploadBase64ToS3({
          base64: ctx.body.avatar,
          folder: "avatars",
          userId: ctx.userId!,
        }),
      ]);

      const [updated] = await db
        .update(usersTable)
        .set({ avatar: avatarKey })
        .where(eq(usersTable.id, ctx.userId!))
        .returning();

      const { password: _, ...userWithoutPassword } = updated;
      return { user: withAvatarUrl(userWithoutPassword) };
    }),
  {
    body: t.Object({
      avatar: t.String(),
    }),
    detail: { tags: ["Profile"], summary: "Upload avatar" },
  }
);

// Delete avatar
profileRoutes.delete(
  "/avatar",
  (ctx) =>
    withHandler(ctx, async () => {
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

      const { password: _, ...userWithoutPassword } = updated;
      return { user: withAvatarUrl(userWithoutPassword) };
    }),
  {
    detail: { tags: ["Profile"], summary: "Delete avatar" },
  }
);
