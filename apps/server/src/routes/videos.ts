import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  videosTable,
  contentStatusEnum,
  moduleItemsTable,
  type SelectVideo,
} from "@/db/schema";
import { count, eq, and, desc } from "drizzle-orm";
import {
  parseListParams,
  buildWhereClause,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type SearchableFields,
  type DateFields,
} from "@/lib/filters";
import { uploadBase64ToS3, deleteFromS3, getPresignedUrl } from "@/lib/upload";
import { generateEmbedding } from "@/lib/ai/embeddings";

async function updateVideoEmbedding(videoId: string, title: string, description: string | null) {
  const text = `${title} ${description || ""}`.trim();
  const embedding = await generateEmbedding(text);
  await db.update(videosTable).set({ embedding }).where(eq(videosTable.id, videoId));
}

const videoFieldMap: FieldMap<typeof videosTable> = {
  id: videosTable.id,
  title: videosTable.title,
  status: videosTable.status,
  duration: videosTable.duration,
  createdAt: videosTable.createdAt,
  updatedAt: videosTable.updatedAt,
};

const videoSearchableFields: SearchableFields<typeof videosTable> = [
  videosTable.title,
];

const videoDateFields: DateFields = new Set(["createdAt"]);

function withUrl(video: SelectVideo): SelectVideo & { videoUrl: string | null } {
  return {
    ...video,
    videoUrl: video.videoKey ? getPresignedUrl(video.videoKey) : null,
  };
}

export const videosRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/upload",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload videos",
            403
          );
        }

        if (!ctx.body.video.startsWith("data:video/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "File must be a video", 400);
        }

        const videoKey = await uploadBase64ToS3({
          base64: ctx.body.video,
          folder: "videos",
          userId: ctx.user.tenantId,
        });

        return {
          videoKey,
          videoUrl: getPresignedUrl(videoKey),
        };
      }),
    {
      body: t.Object({
        video: t.String(),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Upload video file (returns key to use when creating/updating)",
      },
    }
  )
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage videos",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          videoFieldMap,
          videoSearchableFields,
          videoDateFields
        );

        const tenantFilter = eq(videosTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, videoFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select()
          .from(videosTable);

        let query = baseQuery.$dynamic();
        query = query.where(whereClause);
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(videosTable)
          .where(whereClause);

        const [videos, [{ count: total }]] = await Promise.all([
          query,
          countQuery,
        ]);

        return {
          videos: videos.map(withUrl),
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Videos"],
        summary: "List videos with pagination and filters",
      },
    }
  )
  .get(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [video] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.id),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!video) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        return { video: withUrl(video) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Get video by ID",
      },
    }
  )
  .post(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create videos",
            403
          );
        }

        const [video] = await db
          .insert(videosTable)
          .values({
            tenantId: ctx.user.tenantId,
            title: ctx.body.title,
            description: ctx.body.description,
            videoKey: ctx.body.videoKey,
            duration: ctx.body.duration ?? 0,
            status: ctx.body.status ?? "draft",
          })
          .returning();

        updateVideoEmbedding(video.id, video.title, video.description ?? null).catch(() => {});

        return { video: withUrl(video) };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        videoKey: t.Optional(t.String()),
        duration: t.Optional(t.Number({ minimum: 0 })),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Create a new video",
      },
    }
  )
  .put(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update videos",
            403
          );
        }

        const [existingVideo] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.id),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingVideo) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        if (ctx.body.videoKey !== undefined && existingVideo.videoKey && ctx.body.videoKey !== existingVideo.videoKey) {
          await deleteFromS3(existingVideo.videoKey);
        }

        const updateData: Partial<SelectVideo> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.description !== undefined) updateData.description = ctx.body.description;
        if (ctx.body.videoKey !== undefined) updateData.videoKey = ctx.body.videoKey;
        if (ctx.body.duration !== undefined) updateData.duration = ctx.body.duration;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;

        const [updatedVideo] = await db
          .update(videosTable)
          .set(updateData)
          .where(eq(videosTable.id, ctx.params.id))
          .returning();

        if (ctx.body.title !== undefined || ctx.body.description !== undefined) {
          updateVideoEmbedding(
            updatedVideo.id,
            updatedVideo.title,
            updatedVideo.description ?? null
          ).catch(() => {});
        }

        return { video: withUrl(updatedVideo) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        videoKey: t.Optional(t.Union([t.String(), t.Null()])),
        duration: t.Optional(t.Number({ minimum: 0 })),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Update a video",
      },
    }
  )
  .delete(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete videos",
            403
          );
        }

        const [existingVideo] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.id),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingVideo) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        await db
          .delete(moduleItemsTable)
          .where(
            and(
              eq(moduleItemsTable.contentType, "video"),
              eq(moduleItemsTable.contentId, ctx.params.id)
            )
          );

        await Promise.all([
          existingVideo.videoKey ? deleteFromS3(existingVideo.videoKey) : Promise.resolve(),
          db.delete(videosTable).where(eq(videosTable.id, ctx.params.id)),
        ]);

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Delete a video",
      },
    }
  )
  .post(
    "/:id/video",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload videos",
            403
          );
        }

        const [existingVideo] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.id),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingVideo) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        if (!ctx.body.video.startsWith("data:video/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "File must be a video", 400);
        }

        const [, videoKey] = await Promise.all([
          existingVideo.videoKey ? deleteFromS3(existingVideo.videoKey) : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.video,
            folder: "videos",
            userId: ctx.user.tenantId,
          }),
        ]);

        const updateData: Partial<SelectVideo> = { videoKey };
        if (ctx.body.duration !== undefined) {
          updateData.duration = ctx.body.duration;
        }

        const [updatedVideo] = await db
          .update(videosTable)
          .set(updateData)
          .where(eq(videosTable.id, ctx.params.id))
          .returning();

        return { video: withUrl(updatedVideo) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        video: t.String(),
        duration: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Upload video file for a video record",
      },
    }
  )
  .delete(
    "/:id/video",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete videos",
            403
          );
        }

        const [existingVideo] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.id),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingVideo) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        const [, [updatedVideo]] = await Promise.all([
          existingVideo.videoKey ? deleteFromS3(existingVideo.videoKey) : Promise.resolve(),
          db
            .update(videosTable)
            .set({ videoKey: null, duration: 0 })
            .where(eq(videosTable.id, ctx.params.id))
            .returning(),
        ]);

        return { video: withUrl(updatedVideo) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Videos"],
        summary: "Delete video file from a video record",
      },
    }
  );
