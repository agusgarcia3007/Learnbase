import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  featuresTable,
  featureVotesTable,
  featureAttachmentsTable,
  userNotificationsTable,
  usersTable,
  type SelectFeature,
} from "@/db/schema";
import { count, eq, and, desc, sql, inArray, ne } from "drizzle-orm";
import { enqueue } from "@/jobs";
import { getPresignedUrl } from "@/lib/upload";

type FeatureWithVotes = SelectFeature & {
  voteCount: number;
  userVote: number | null;
  submittedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  attachments: {
    id: string;
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }[];
};

async function getFeatureWithDetails(
  featureId: string,
  userId?: string | null
): Promise<FeatureWithVotes | null> {
  const [feature] = await db
    .select()
    .from(featuresTable)
    .where(eq(featuresTable.id, featureId))
    .limit(1);

  if (!feature) return null;

  const [submitterResult, voteSumResult, userVoteResult, attachmentsResult] =
    await Promise.all([
      db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          avatar: usersTable.avatar,
        })
        .from(usersTable)
        .where(eq(usersTable.id, feature.submittedById))
        .limit(1),
      db
        .select({
          total: sql<number>`COALESCE(SUM(${featureVotesTable.value}), 0)`,
        })
        .from(featureVotesTable)
        .where(eq(featureVotesTable.featureId, featureId)),
      userId
        ? db
            .select({ value: featureVotesTable.value })
            .from(featureVotesTable)
            .where(
              and(
                eq(featureVotesTable.featureId, featureId),
                eq(featureVotesTable.userId, userId)
              )
            )
            .limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(featureAttachmentsTable)
        .where(eq(featureAttachmentsTable.featureId, featureId)),
    ]);

  const submitter = submitterResult[0];
  const voteSum = voteSumResult[0];
  const userVote = userVoteResult[0]?.value ?? null;

  return {
    ...feature,
    voteCount: Number(voteSum?.total ?? 0),
    userVote,
    submittedBy: submitter || {
      id: feature.submittedById,
      name: "Unknown",
      avatar: null,
    },
    attachments: attachmentsResult.map((a) => ({
      ...a,
      url: getPresignedUrl(a.fileKey),
    })),
  };
}

export const featuresRoutes = new Elysia()
  .use(authPlugin)
  .use(guardPlugin)
  .get(
    "/",
    async (ctx) => {
      const visibleStatuses = ["ideas", "in_progress", "shipped"] as const;

      const features = await db
        .select()
        .from(featuresTable)
        .where(inArray(featuresTable.status, [...visibleStatuses]))
        .orderBy(featuresTable.order, desc(featuresTable.createdAt));

      const featureIds = features.map((f) => f.id);

      const submitterIds = [...new Set(features.map((f) => f.submittedById))];

      const [submitters, voteSums, userVotesResult, attachments] =
        await Promise.all([
          submitterIds.length > 0
            ? db
                .select({
                  id: usersTable.id,
                  name: usersTable.name,
                  avatar: usersTable.avatar,
                })
                .from(usersTable)
                .where(inArray(usersTable.id, submitterIds))
            : Promise.resolve([]),
          featureIds.length > 0
            ? db
                .select({
                  featureId: featureVotesTable.featureId,
                  total: sql<number>`COALESCE(SUM(${featureVotesTable.value}), 0)`,
                })
                .from(featureVotesTable)
                .where(inArray(featureVotesTable.featureId, featureIds))
                .groupBy(featureVotesTable.featureId)
            : Promise.resolve([]),
          ctx.userId && featureIds.length > 0
            ? db
                .select({
                  featureId: featureVotesTable.featureId,
                  value: featureVotesTable.value,
                })
                .from(featureVotesTable)
                .where(
                  and(
                    inArray(featureVotesTable.featureId, featureIds),
                    eq(featureVotesTable.userId, ctx.userId)
                  )
                )
            : Promise.resolve([]),
          featureIds.length > 0
            ? db
                .select()
                .from(featureAttachmentsTable)
                .where(inArray(featureAttachmentsTable.featureId, featureIds))
            : Promise.resolve([]),
        ]);

      const submitterMap = new Map(submitters.map((s) => [s.id, s]));
      const voteMap = new Map(
        voteSums.map((v) => [v.featureId, Number(v.total)])
      );
      const userVotes = new Map(
        userVotesResult.map((v) => [v.featureId, v.value])
      );
      const attachmentMap = new Map<string, typeof attachments>();
      for (const a of attachments) {
        const list = attachmentMap.get(a.featureId) || [];
        list.push(a);
        attachmentMap.set(a.featureId, list);
      }

      const enrichedFeatures: FeatureWithVotes[] = features.map((f) => ({
        ...f,
        voteCount: voteMap.get(f.id) ?? 0,
        userVote: userVotes.get(f.id) ?? null,
        submittedBy: submitterMap.get(f.submittedById) || {
          id: f.submittedById,
          name: "Unknown",
          avatar: null,
        },
        attachments: (attachmentMap.get(f.id) || []).map((a) => ({
          ...a,
          url: getPresignedUrl(a.fileKey),
        })),
      }));

      const ideas = enrichedFeatures.filter((f) => f.status === "ideas");
      const inProgress = enrichedFeatures.filter(
        (f) => f.status === "in_progress"
      );
      const shipped = enrichedFeatures.filter((f) => f.status === "shipped");

      return { features: { ideas, inProgress, shipped } };
    },
    {
      detail: {
        tags: ["Features"],
        summary: "Get all visible features grouped by status",
      },
    }
  )
  .get(
    "/pending",
    async (ctx) => {
      const features = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.status, "pending"))
        .orderBy(desc(featuresTable.createdAt));

      const featureIds = features.map((f) => f.id);

      const submitterIds = [...new Set(features.map((f) => f.submittedById))];

      const [submitters, attachments] = await Promise.all([
        submitterIds.length > 0
          ? db
              .select({
                id: usersTable.id,
                name: usersTable.name,
                avatar: usersTable.avatar,
              })
              .from(usersTable)
              .where(inArray(usersTable.id, submitterIds))
          : Promise.resolve([]),
        featureIds.length > 0
          ? db
              .select()
              .from(featureAttachmentsTable)
              .where(inArray(featureAttachmentsTable.featureId, featureIds))
          : Promise.resolve([]),
      ]);

      const submitterMap = new Map(submitters.map((s) => [s.id, s]));
      const attachmentMap = new Map<string, typeof attachments>();
      for (const a of attachments) {
        const list = attachmentMap.get(a.featureId) || [];
        list.push(a);
        attachmentMap.set(a.featureId, list);
      }

      const enrichedFeatures = features.map((f) => ({
        ...f,
        voteCount: 0,
        userVote: null,
        submittedBy: submitterMap.get(f.submittedById) || {
          id: f.submittedById,
          name: "Unknown",
          avatar: null,
        },
        attachments: (attachmentMap.get(f.id) || []).map((a) => ({
          ...a,
          url: getPresignedUrl(a.fileKey),
        })),
      }));

      return { features: enrichedFeatures };
    },
    {
      detail: {
        tags: ["Features"],
        summary: "Get pending feature submissions (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .get(
    "/:id",
    async (ctx) => {
      const feature = await getFeatureWithDetails(ctx.params.id, ctx.userId);

      if (!feature) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      if (feature.status === "pending" && ctx.userRole !== "superadmin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Feature not found", 404);
      }

      return { feature };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Features"],
        summary: "Get feature by ID",
      },
    }
  )
  .post(
    "/",
    async (ctx) => {
      const [feature] = await db
        .insert(featuresTable)
        .values({
          title: ctx.body.title,
          description: ctx.body.description,
          priority: ctx.body.priority,
          status: "pending",
          submittedById: ctx.userId!,
        })
        .returning();

      if (ctx.body.attachmentKeys && ctx.body.attachmentKeys.length > 0) {
        await db.insert(featureAttachmentsTable).values(
          ctx.body.attachmentKeys.map((key) => ({
            featureId: feature.id,
            fileKey: key.fileKey,
            fileName: key.fileName,
            fileSize: key.fileSize,
            mimeType: key.mimeType,
          }))
        );
      }

      enqueue({
        type: "send-feature-submission-email",
        data: {
          email: ctx.user!.email,
          userName: ctx.user!.name,
          featureTitle: feature.title,
        },
      });

      const result = await getFeatureWithDetails(feature.id, ctx.userId);
      return { feature: result };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        priority: t.Union([
          t.Literal("low"),
          t.Literal("medium"),
          t.Literal("high"),
          t.Literal("critical"),
        ]),
        attachmentKeys: t.Optional(
          t.Array(
            t.Object({
              fileKey: t.String(),
              fileName: t.String(),
              fileSize: t.Number(),
              mimeType: t.String(),
            })
          )
        ),
      }),
      detail: {
        tags: ["Features"],
        summary: "Submit a new feature request",
      },
      requireAuth: true,
    }
  )
  .post(
    "/direct",
    async (ctx) => {
      const [maxOrder] = await db
        .select({ maxOrder: featuresTable.order })
        .from(featuresTable)
        .where(eq(featuresTable.status, ctx.body.status || "ideas"))
        .orderBy(desc(featuresTable.order))
        .limit(1);

      const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

      const [feature] = await db
        .insert(featuresTable)
        .values({
          title: ctx.body.title,
          description: ctx.body.description,
          priority: ctx.body.priority,
          status: ctx.body.status || "ideas",
          order: nextOrder,
          submittedById: ctx.userId!,
          approvedById: ctx.userId!,
          approvedAt: new Date(),
        })
        .returning();

      const result = await getFeatureWithDetails(feature.id, ctx.userId);
      return { feature: result };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        priority: t.Union([
          t.Literal("low"),
          t.Literal("medium"),
          t.Literal("high"),
          t.Literal("critical"),
        ]),
        status: t.Optional(
          t.Union([
            t.Literal("ideas"),
            t.Literal("in_progress"),
            t.Literal("shipped"),
          ])
        ),
      }),
      detail: {
        tags: ["Features"],
        summary: "Create a feature directly (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .put(
    "/:id",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      const updateData: Partial<SelectFeature> = {};
      if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
      if (ctx.body.description !== undefined)
        updateData.description = ctx.body.description;
      if (ctx.body.priority !== undefined)
        updateData.priority = ctx.body.priority;

      const [updated] = await db
        .update(featuresTable)
        .set(updateData)
        .where(eq(featuresTable.id, ctx.params.id))
        .returning();

      const result = await getFeatureWithDetails(updated.id, ctx.userId);
      return { feature: result };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String({ minLength: 1 })),
        priority: t.Optional(
          t.Union([
            t.Literal("low"),
            t.Literal("medium"),
            t.Literal("high"),
            t.Literal("critical"),
          ])
        ),
      }),
      detail: {
        tags: ["Features"],
        summary: "Update a feature (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .put(
    "/:id/status",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      const updateData: Partial<SelectFeature> = {
        status: ctx.body.status,
      };

      if (ctx.body.order !== undefined) {
        updateData.order = ctx.body.order;
      }

      if (ctx.body.status === "shipped" && existing.status !== "shipped") {
        updateData.shippedAt = new Date();

        const [submitter] = await db
          .select({ email: usersTable.email, name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, existing.submittedById))
          .limit(1);

        if (submitter && submitter.email !== ctx.user!.email) {
          await db.insert(userNotificationsTable).values({
            userId: existing.submittedById,
            type: "feature_shipped",
            title: "Feature Shipped!",
            message: `Your feature "${existing.title}" has been shipped!`,
            metadata: { featureId: existing.id, featureTitle: existing.title },
          });
        }
      }

      const [updated] = await db
        .update(featuresTable)
        .set(updateData)
        .where(eq(featuresTable.id, ctx.params.id))
        .returning();

      const result = await getFeatureWithDetails(updated.id, ctx.userId);
      return { feature: result };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        status: t.Union([
          t.Literal("ideas"),
          t.Literal("in_progress"),
          t.Literal("shipped"),
        ]),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Features"],
        summary: "Change feature status (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .post(
    "/:id/approve",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      if (existing.status !== "pending") {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Feature is not pending",
          400
        );
      }

      const [maxOrder] = await db
        .select({ maxOrder: featuresTable.order })
        .from(featuresTable)
        .where(eq(featuresTable.status, "ideas"))
        .orderBy(desc(featuresTable.order))
        .limit(1);

      const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

      const [updated] = await db
        .update(featuresTable)
        .set({
          status: "ideas",
          order: nextOrder,
          approvedById: ctx.userId!,
          approvedAt: new Date(),
        })
        .where(eq(featuresTable.id, ctx.params.id))
        .returning();

      const [submitter] = await db
        .select({ email: usersTable.email, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, existing.submittedById))
        .limit(1);

      if (submitter) {
        await db.insert(userNotificationsTable).values({
          userId: existing.submittedById,
          type: "feature_approved",
          title: "Feature Approved!",
          message: `Your feature "${existing.title}" has been approved and added to our roadmap!`,
          metadata: { featureId: existing.id, featureTitle: existing.title },
        });

        enqueue({
          type: "send-feature-approved-email",
          data: {
            email: submitter.email,
            userName: submitter.name,
            featureTitle: existing.title,
            featuresUrl: `${
              process.env.BASE_URL || "https://uselearnbase.com"
            }/features`,
          },
        });
      }

      const result = await getFeatureWithDetails(updated.id, ctx.userId);
      return { feature: result };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Features"],
        summary: "Approve a pending feature (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .post(
    "/:id/reject",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      if (existing.status !== "pending") {
        throw new AppError(
          ErrorCode.BAD_REQUEST,
          "Feature is not pending",
          400
        );
      }

      const [submitter] = await db
        .select({ email: usersTable.email, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, existing.submittedById))
        .limit(1);

      if (submitter) {
        await db.insert(userNotificationsTable).values({
          userId: existing.submittedById,
          type: "feature_rejected",
          title: "Feature Update",
          message: ctx.body.reason
            ? `Your feature "${existing.title}" was not accepted: ${ctx.body.reason}`
            : `Your feature "${existing.title}" was not accepted at this time.`,
          metadata: {
            featureId: existing.id,
            featureTitle: existing.title,
            rejectionReason: ctx.body.reason,
          },
        });

        enqueue({
          type: "send-feature-rejected-email",
          data: {
            email: submitter.email,
            userName: submitter.name,
            featureTitle: existing.title,
            rejectionReason: ctx.body.reason,
          },
        });
      }

      await db.delete(featuresTable).where(eq(featuresTable.id, ctx.params.id));

      return { success: true };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        reason: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Features"],
        summary: "Reject a pending feature (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      await db.delete(featuresTable).where(eq(featuresTable.id, ctx.params.id));

      return { success: true };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Features"],
        summary: "Delete a feature (superadmin only)",
      },
      requireAuth: true,
      requireRole: ["superadmin"],
    }
  )
  .post(
    "/:id/vote",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(featuresTable)
        .where(eq(featuresTable.id, ctx.params.id))
        .limit(1);

      if (!existing || existing.status === "pending") {
        throw new AppError(ErrorCode.NOT_FOUND, "Feature not found", 404);
      }

      const [existingVote] = await db
        .select()
        .from(featureVotesTable)
        .where(
          and(
            eq(featureVotesTable.featureId, ctx.params.id),
            eq(featureVotesTable.userId, ctx.userId!)
          )
        )
        .limit(1);

      if (existingVote) {
        if (existingVote.value === ctx.body.value) {
          await db
            .delete(featureVotesTable)
            .where(eq(featureVotesTable.id, existingVote.id));
        } else {
          await db
            .update(featureVotesTable)
            .set({ value: ctx.body.value })
            .where(eq(featureVotesTable.id, existingVote.id));
        }
      } else {
        await db.insert(featureVotesTable).values({
          featureId: ctx.params.id,
          userId: ctx.userId!,
          value: ctx.body.value,
        });
      }

      const [[voteSum], [currentVote]] = await Promise.all([
        db
          .select({
            total: sql<number>`COALESCE(SUM(${featureVotesTable.value}), 0)`,
          })
          .from(featureVotesTable)
          .where(eq(featureVotesTable.featureId, ctx.params.id)),
        db
          .select({ value: featureVotesTable.value })
          .from(featureVotesTable)
          .where(
            and(
              eq(featureVotesTable.featureId, ctx.params.id),
              eq(featureVotesTable.userId, ctx.userId!)
            )
          )
          .limit(1),
      ]);

      return {
        voteCount: Number(voteSum?.total ?? 0),
        userVote: currentVote?.value ?? null,
      };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        value: t.Union([t.Literal(1), t.Literal(-1)]),
      }),
      detail: {
        tags: ["Features"],
        summary: "Vote on a feature",
      },
      requireAuth: true,
    }
  )
  .delete(
    "/:id/vote",
    async (ctx) => {
      await db
        .delete(featureVotesTable)
        .where(
          and(
            eq(featureVotesTable.featureId, ctx.params.id),
            eq(featureVotesTable.userId, ctx.userId!)
          )
        );

      const [voteSum] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${featureVotesTable.value}), 0)`,
        })
        .from(featureVotesTable)
        .where(eq(featureVotesTable.featureId, ctx.params.id));

      return {
        voteCount: Number(voteSum?.total ?? 0),
        userVote: null,
      };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Features"],
        summary: "Remove vote from a feature",
      },
      requireAuth: true,
    }
  );
