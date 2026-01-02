import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  aiConversationsTable,
  aiMessagesTable,
  usersTable,
  coursesTable,
} from "@/db/schema";
import { eq, and, desc, count, gte, lte, sql, or, ilike } from "drizzle-orm";
import {
  parseListParams,
  buildWhereClause,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type DateFields,
} from "@/lib/filters";

const fieldMap: FieldMap<typeof aiConversationsTable> = {
  type: aiConversationsTable.type,
  createdAt: aiConversationsTable.createdAt,
  lastMessageAt: aiConversationsTable.lastMessageAt,
};

const adminFieldMap: FieldMap<typeof aiConversationsTable> = {
  createdAt: aiConversationsTable.createdAt,
  lastMessageAt: aiConversationsTable.lastMessageAt,
  userId: aiConversationsTable.userId,
};

const dateFields: DateFields = new Set(["createdAt", "lastMessageAt"]);

export const aiConversationsRoutes = new Elysia({ name: "ai-conversations" })
  .use(authPlugin)
  .use(guardPlugin)
  .get(
    "/conversations",
    async (ctx) => {
      const userId = ctx.user!.id;
      const tenantId = ctx.user!.tenantId!;

      const params = parseListParams(ctx.query);
      const baseWhere = buildWhereClause(params, fieldMap, [], dateFields);
      const userFilter = and(
        eq(aiConversationsTable.userId, userId),
        eq(aiConversationsTable.tenantId, tenantId)
      );
      const whereClause = baseWhere ? and(baseWhere, userFilter) : userFilter;

      const sortColumn = getSortColumn(params.sort, fieldMap, {
        field: "lastMessageAt",
        order: "desc",
      });
      const { limit, offset } = getPaginationParams(params.page, params.limit);

      const [conversations, [{ total }]] = await Promise.all([
        db
          .select({
            id: aiConversationsTable.id,
            type: aiConversationsTable.type,
            title: aiConversationsTable.title,
            metadata: aiConversationsTable.metadata,
            messageCount: aiConversationsTable.messageCount,
            lastMessageAt: aiConversationsTable.lastMessageAt,
            createdAt: aiConversationsTable.createdAt,
            updatedAt: aiConversationsTable.updatedAt,
          })
          .from(aiConversationsTable)
          .where(whereClause)
          .orderBy(sortColumn ?? desc(aiConversationsTable.lastMessageAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(aiConversationsTable)
          .where(whereClause),
      ]);

      return {
        conversations,
        pagination: calculatePagination(total, params.page, params.limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        type: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
        lastMessageAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI Conversations"],
        summary: "List user's AI conversations",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .get(
    "/conversations/:id",
    async (ctx) => {
      const userId = ctx.user!.id;
      const tenantId = ctx.user!.tenantId!;
      const { id } = ctx.params;

      const [conversation] = await db
        .select()
        .from(aiConversationsTable)
        .where(
          and(
            eq(aiConversationsTable.id, id),
            eq(aiConversationsTable.userId, userId),
            eq(aiConversationsTable.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new AppError(ErrorCode.NOT_FOUND, "Conversation not found", 404);
      }

      const messages = await db
        .select()
        .from(aiMessagesTable)
        .where(eq(aiMessagesTable.conversationId, id))
        .orderBy(aiMessagesTable.createdAt);

      return { conversation, messages };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI Conversations"],
        summary: "Get conversation with messages",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .post(
    "/conversations",
    async (ctx) => {
      const userId = ctx.user!.id;
      const tenantId = ctx.user!.tenantId!;

      const [conversation] = await db
        .insert(aiConversationsTable)
        .values({
          userId,
          tenantId,
          type: ctx.body.type,
          title: ctx.body.title,
          metadata: ctx.body.metadata,
        })
        .returning();

      return { conversation };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("learn"), t.Literal("creator")]),
        title: t.Optional(t.String()),
        metadata: t.Optional(
          t.Object({
            courseId: t.Optional(t.String()),
            courseTitle: t.Optional(t.String()),
            itemId: t.Optional(t.String()),
            itemTitle: t.Optional(t.String()),
            contextCourseIds: t.Optional(t.Array(t.String())),
          })
        ),
      }),
      detail: {
        tags: ["AI Conversations"],
        summary: "Create new conversation",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .delete(
    "/conversations/:id",
    async (ctx) => {
      const userId = ctx.user!.id;
      const tenantId = ctx.user!.tenantId!;
      const { id } = ctx.params;

      const [deleted] = await db
        .delete(aiConversationsTable)
        .where(
          and(
            eq(aiConversationsTable.id, id),
            eq(aiConversationsTable.userId, userId),
            eq(aiConversationsTable.tenantId, tenantId)
          )
        )
        .returning();

      if (!deleted) {
        throw new AppError(ErrorCode.NOT_FOUND, "Conversation not found", 404);
      }

      return { success: true };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI Conversations"],
        summary: "Delete conversation",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .patch(
    "/conversations/:id/messages",
    async (ctx) => {
      const userId = ctx.user!.id;
      const tenantId = ctx.user!.tenantId!;
      const { id } = ctx.params;
      const { messages } = ctx.body;

      const [conversation] = await db
        .select()
        .from(aiConversationsTable)
        .where(
          and(
            eq(aiConversationsTable.id, id),
            eq(aiConversationsTable.userId, userId),
            eq(aiConversationsTable.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new AppError(ErrorCode.NOT_FOUND, "Conversation not found", 404);
      }

      if (messages.length > 0) {
        await db
          .delete(aiMessagesTable)
          .where(eq(aiMessagesTable.conversationId, id));

        await db.insert(aiMessagesTable).values(
          messages.map((msg) => ({
            conversationId: id,
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments || null,
            toolInvocations: msg.toolInvocations || null,
          }))
        );

        await db
          .update(aiConversationsTable)
          .set({
            messageCount: messages.length,
            lastMessageAt: new Date(),
          })
          .where(eq(aiConversationsTable.id, id));
      }

      return { success: true };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.Union([t.Literal("user"), t.Literal("assistant")]),
            content: t.String(),
            attachments: t.Optional(
              t.Array(
                t.Union([
                  t.Object({
                    type: t.Literal("image"),
                    key: t.String(),
                  }),
                  t.Object({
                    type: t.Literal("file"),
                    data: t.String(),
                    mimeType: t.String(),
                    fileName: t.Optional(t.String()),
                  }),
                ])
              )
            ),
            toolInvocations: t.Optional(
              t.Array(
                t.Object({
                  id: t.String(),
                  toolName: t.String(),
                  args: t.Record(t.String(), t.Unknown()),
                  result: t.Optional(t.Unknown()),
                })
              )
            ),
          })
        ),
      }),
      detail: {
        tags: ["AI Conversations"],
        summary: "Save messages to conversation",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .get(
    "/conversations/admin/list",
    async (ctx) => {
      const tenantId = ctx.user!.tenantId!;

      const params = parseListParams(ctx.query);

      const tenantFilter = and(
        eq(aiConversationsTable.tenantId, tenantId),
        eq(aiConversationsTable.type, "learn")
      );

      const baseWhere = buildWhereClause(params, adminFieldMap, [], dateFields);

      let searchFilter = undefined;
      if (params.search) {
        searchFilter = or(
          ilike(usersTable.name, `%${params.search}%`),
          ilike(usersTable.email, `%${params.search}%`)
        );
      }

      let courseFilter = undefined;
      if (ctx.query.courseId) {
        courseFilter = sql`${aiConversationsTable.metadata}->>'courseId' = ${ctx.query.courseId}`;
      }

      const whereClause = and(
        tenantFilter,
        baseWhere || undefined,
        searchFilter,
        courseFilter
      );

      const sortColumn = getSortColumn(params.sort, fieldMap, {
        field: "createdAt",
        order: "desc",
      });
      const { limit, offset } = getPaginationParams(params.page, params.limit);

      const [conversations, [{ total }]] = await Promise.all([
        db
          .select({
            id: aiConversationsTable.id,
            type: aiConversationsTable.type,
            title: aiConversationsTable.title,
            messageCount: aiConversationsTable.messageCount,
            createdAt: aiConversationsTable.createdAt,
            lastMessageAt: aiConversationsTable.lastMessageAt,
            metadata: aiConversationsTable.metadata,
            user: {
              id: usersTable.id,
              name: usersTable.name,
              email: usersTable.email,
              avatar: usersTable.avatar,
            },
          })
          .from(aiConversationsTable)
          .leftJoin(usersTable, eq(aiConversationsTable.userId, usersTable.id))
          .where(whereClause)
          .orderBy(sortColumn ?? desc(aiConversationsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(aiConversationsTable)
          .leftJoin(usersTable, eq(aiConversationsTable.userId, usersTable.id))
          .where(whereClause),
      ]);

      return {
        conversations,
        pagination: calculatePagination(total, params.page, params.limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["AI Conversations"],
        summary: "List all tenant conversations (admin)",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .get(
    "/conversations/admin/:id",
    async (ctx) => {
      const tenantId = ctx.user!.tenantId!;
      const { id } = ctx.params;

      const [conversation] = await db
        .select({
          id: aiConversationsTable.id,
          type: aiConversationsTable.type,
          title: aiConversationsTable.title,
          metadata: aiConversationsTable.metadata,
          messageCount: aiConversationsTable.messageCount,
          lastMessageAt: aiConversationsTable.lastMessageAt,
          createdAt: aiConversationsTable.createdAt,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            avatar: usersTable.avatar,
          },
        })
        .from(aiConversationsTable)
        .leftJoin(usersTable, eq(aiConversationsTable.userId, usersTable.id))
        .where(
          and(
            eq(aiConversationsTable.id, id),
            eq(aiConversationsTable.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new AppError(ErrorCode.NOT_FOUND, "Conversation not found", 404);
      }

      const messages = await db
        .select()
        .from(aiMessagesTable)
        .where(eq(aiMessagesTable.conversationId, id))
        .orderBy(aiMessagesTable.createdAt);

      return { conversation, messages };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI Conversations"],
        summary: "Get conversation with messages (admin)",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .get(
    "/conversations/admin/analytics",
    async (ctx) => {
      const tenantId = ctx.user!.tenantId!;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filter = and(
        eq(aiConversationsTable.tenantId, tenantId),
        eq(aiConversationsTable.type, "learn"),
        gte(aiConversationsTable.createdAt, thirtyDaysAgo)
      );

      const [stats, byType, dailyTrend] = await Promise.all([
        db
          .select({
            totalConversations: count(),
            totalMessages: sql<number>`COALESCE(SUM(${aiConversationsTable.messageCount}), 0)`,
          })
          .from(aiConversationsTable)
          .where(filter),
        db
          .select({
            type: aiConversationsTable.type,
            count: count(),
          })
          .from(aiConversationsTable)
          .where(filter)
          .groupBy(aiConversationsTable.type),
        db
          .select({
            date: sql<string>`DATE(${aiConversationsTable.createdAt})`.as(
              "date"
            ),
            count: count(),
          })
          .from(aiConversationsTable)
          .where(filter)
          .groupBy(sql`DATE(${aiConversationsTable.createdAt})`)
          .orderBy(sql`DATE(${aiConversationsTable.createdAt})`),
      ]);

      return {
        totalConversations: stats[0]?.totalConversations ?? 0,
        totalMessages: Number(stats[0]?.totalMessages) || 0,
        byType: {
          learn: byType.find((b) => b.type === "learn")?.count ?? 0,
          creator: byType.find((b) => b.type === "creator")?.count ?? 0,
        },
        dailyTrend,
      };
    },
    {
      detail: {
        tags: ["AI Conversations"],
        summary: "Get AI conversation analytics",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  );
