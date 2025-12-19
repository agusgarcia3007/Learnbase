import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { userNotificationsTable } from "@/db/schema";
import { count, eq, and, desc } from "drizzle-orm";

export const notificationsRoutes = new Elysia()
  .use(authPlugin)
  .use(guardPlugin)
  .get(
    "/",
    async (ctx) => {
      const notifications = await db
        .select()
        .from(userNotificationsTable)
        .where(eq(userNotificationsTable.userId, ctx.userId!))
        .orderBy(desc(userNotificationsTable.createdAt))
        .limit(50);

      return { notifications };
    },
    {
      detail: {
        tags: ["Notifications"],
        summary: "Get user notifications",
      },
      requireAuth: true,
    }
  )
  .get(
    "/unread-count",
    async (ctx) => {
      const [result] = await db
        .select({ count: count() })
        .from(userNotificationsTable)
        .where(
          and(
            eq(userNotificationsTable.userId, ctx.userId!),
            eq(userNotificationsTable.isRead, false)
          )
        );

      return { count: result?.count ?? 0 };
    },
    {
      detail: {
        tags: ["Notifications"],
        summary: "Get unread notification count",
      },
      requireAuth: true,
    }
  )
  .put(
    "/:id/read",
    async (ctx) => {
      const [notification] = await db
        .select()
        .from(userNotificationsTable)
        .where(
          and(
            eq(userNotificationsTable.id, ctx.params.id),
            eq(userNotificationsTable.userId, ctx.userId!)
          )
        )
        .limit(1);

      if (!notification) {
        throw new AppError(ErrorCode.NOT_FOUND, "Notification not found", 404);
      }

      await db
        .update(userNotificationsTable)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(userNotificationsTable.id, ctx.params.id));

      return { success: true };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
      },
      requireAuth: true,
    }
  )
  .put(
    "/read-all",
    async (ctx) => {
      await db
        .update(userNotificationsTable)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(userNotificationsTable.userId, ctx.userId!),
            eq(userNotificationsTable.isRead, false)
          )
        );

      return { success: true };
    },
    {
      detail: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
      },
      requireAuth: true,
    }
  );
