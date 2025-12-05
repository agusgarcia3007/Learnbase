import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  lessonsTable,
  lessonTypeEnum,
  lessonStatusEnum,
  type SelectLesson,
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

const lessonFieldMap: FieldMap<typeof lessonsTable> = {
  id: lessonsTable.id,
  title: lessonsTable.title,
  type: lessonsTable.type,
  status: lessonsTable.status,
  duration: lessonsTable.duration,
  order: lessonsTable.order,
  createdAt: lessonsTable.createdAt,
  updatedAt: lessonsTable.updatedAt,
};

const lessonSearchableFields: SearchableFields<typeof lessonsTable> = [
  lessonsTable.title,
];

const lessonDateFields: DateFields = new Set(["createdAt"]);

function withUrls(lesson: SelectLesson): SelectLesson & { videoUrl: string | null; fileUrl: string | null } {
  return {
    ...lesson,
    videoUrl: lesson.videoKey ? getPresignedUrl(lesson.videoKey) : null,
    fileUrl: lesson.fileKey ? getPresignedUrl(lesson.fileKey) : null,
  };
}

export const lessonsRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/video",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
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
          folder: "lessons",
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
        tags: ["Lessons"],
        summary: "Upload video for lessons (returns key to use when creating/updating)",
      },
    }
  )
  .post(
    "/file",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload files",
            403
          );
        }

        const allowedMimeTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];

        const mimeTypeMatch = ctx.body.file.match(/^data:([^;]+);base64,/);
        if (!mimeTypeMatch || !allowedMimeTypes.includes(mimeTypeMatch[1])) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "File must be a PDF, Word, Excel, or PowerPoint document",
            400
          );
        }

        const fileKey = await uploadBase64ToS3({
          base64: ctx.body.file,
          folder: "files",
          userId: ctx.user.tenantId,
        });

        return {
          fileKey,
          fileUrl: getPresignedUrl(fileKey),
          fileName: ctx.body.fileName,
          fileSize: ctx.body.fileSize,
          mimeType: mimeTypeMatch[1],
        };
      }),
    {
      body: t.Object({
        file: t.String(),
        fileName: t.String(),
        fileSize: t.Number(),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Upload file for lessons (returns key to use when creating/updating)",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage lessons",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          lessonFieldMap,
          lessonSearchableFields,
          lessonDateFields
        );

        const tenantFilter = eq(lessonsTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, lessonFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select({
            id: lessonsTable.id,
            tenantId: lessonsTable.tenantId,
            title: lessonsTable.title,
            description: lessonsTable.description,
            type: lessonsTable.type,
            videoKey: lessonsTable.videoKey,
            duration: lessonsTable.duration,
            fileKey: lessonsTable.fileKey,
            fileName: lessonsTable.fileName,
            fileSize: lessonsTable.fileSize,
            mimeType: lessonsTable.mimeType,
            order: lessonsTable.order,
            isPreview: lessonsTable.isPreview,
            status: lessonsTable.status,
            createdAt: lessonsTable.createdAt,
            updatedAt: lessonsTable.updatedAt,
          })
          .from(lessonsTable);

        let query = baseQuery.$dynamic();
        query = query.where(whereClause);
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(lessonsTable)
          .where(whereClause);

        const [lessons, [{ count: total }]] = await Promise.all([
          query,
          countQuery,
        ]);

        return {
          lessons: lessons.map(withUrls),
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        type: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "List lessons with pagination and filters",
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

        const [lesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!lesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        return { lesson: withUrls(lesson) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Get lesson by ID",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create lessons",
            403
          );
        }

        const [maxOrder] = await db
          .select({ maxOrder: lessonsTable.order })
          .from(lessonsTable)
          .where(eq(lessonsTable.tenantId, ctx.user.tenantId))
          .orderBy(desc(lessonsTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const [lesson] = await db
          .insert(lessonsTable)
          .values({
            tenantId: ctx.user.tenantId,
            title: ctx.body.title,
            description: ctx.body.description,
            type: ctx.body.type,
            videoKey: ctx.body.videoKey,
            duration: ctx.body.duration ?? 0,
            fileKey: ctx.body.fileKey,
            fileName: ctx.body.fileName,
            fileSize: ctx.body.fileSize,
            mimeType: ctx.body.mimeType,
            order: nextOrder,
            isPreview: ctx.body.isPreview ?? false,
            status: ctx.body.status ?? "draft",
          })
          .returning();

        return { lesson: withUrls(lesson) };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        type: t.Enum(Object.fromEntries(lessonTypeEnum.enumValues.map((v) => [v, v]))),
        videoKey: t.Optional(t.String()),
        duration: t.Optional(t.Number({ minimum: 0 })),
        fileKey: t.Optional(t.String()),
        fileName: t.Optional(t.String()),
        fileSize: t.Optional(t.Number({ minimum: 0 })),
        mimeType: t.Optional(t.String()),
        isPreview: t.Optional(t.Boolean()),
        status: t.Optional(t.Enum(Object.fromEntries(lessonStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Create a new lesson",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update lessons",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        if (ctx.body.videoKey !== undefined && existingLesson.videoKey && ctx.body.videoKey !== existingLesson.videoKey) {
          await deleteFromS3(existingLesson.videoKey);
        }

        if (ctx.body.fileKey !== undefined && existingLesson.fileKey && ctx.body.fileKey !== existingLesson.fileKey) {
          await deleteFromS3(existingLesson.fileKey);
        }

        const updateData: Partial<SelectLesson> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.description !== undefined) updateData.description = ctx.body.description;
        if (ctx.body.type !== undefined) updateData.type = ctx.body.type;
        if (ctx.body.videoKey !== undefined) updateData.videoKey = ctx.body.videoKey;
        if (ctx.body.duration !== undefined) updateData.duration = ctx.body.duration;
        if (ctx.body.fileKey !== undefined) updateData.fileKey = ctx.body.fileKey;
        if (ctx.body.fileName !== undefined) updateData.fileName = ctx.body.fileName;
        if (ctx.body.fileSize !== undefined) updateData.fileSize = ctx.body.fileSize;
        if (ctx.body.mimeType !== undefined) updateData.mimeType = ctx.body.mimeType;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;
        if (ctx.body.isPreview !== undefined) updateData.isPreview = ctx.body.isPreview;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;

        const [updatedLesson] = await db
          .update(lessonsTable)
          .set(updateData)
          .where(eq(lessonsTable.id, ctx.params.id))
          .returning();

        return { lesson: withUrls(updatedLesson) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        type: t.Optional(t.Enum(Object.fromEntries(lessonTypeEnum.enumValues.map((v) => [v, v])))),
        videoKey: t.Optional(t.Union([t.String(), t.Null()])),
        duration: t.Optional(t.Number({ minimum: 0 })),
        fileKey: t.Optional(t.Union([t.String(), t.Null()])),
        fileName: t.Optional(t.Union([t.String(), t.Null()])),
        fileSize: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        mimeType: t.Optional(t.Union([t.String(), t.Null()])),
        order: t.Optional(t.Number({ minimum: 0 })),
        isPreview: t.Optional(t.Boolean()),
        status: t.Optional(t.Enum(Object.fromEntries(lessonStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Update a lesson",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete lessons",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        await Promise.all([
          existingLesson.videoKey ? deleteFromS3(existingLesson.videoKey) : Promise.resolve(),
          existingLesson.fileKey ? deleteFromS3(existingLesson.fileKey) : Promise.resolve(),
          db.delete(lessonsTable).where(eq(lessonsTable.id, ctx.params.id)),
        ]);

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Delete a lesson",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload videos",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        if (!ctx.body.video.startsWith("data:video/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "File must be a video", 400);
        }

        const [, videoKey] = await Promise.all([
          existingLesson.videoKey ? deleteFromS3(existingLesson.videoKey) : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.video,
            folder: "lessons",
            userId: ctx.user.tenantId,
          }),
        ]);

        const updateData: Partial<SelectLesson> = { videoKey };
        if (ctx.body.duration !== undefined) {
          updateData.duration = ctx.body.duration;
        }

        const [updatedLesson] = await db
          .update(lessonsTable)
          .set(updateData)
          .where(eq(lessonsTable.id, ctx.params.id))
          .returning();

        return { lesson: withUrls(updatedLesson) };
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
        tags: ["Lessons"],
        summary: "Upload video for a lesson",
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

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete videos",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        const [, [updatedLesson]] = await Promise.all([
          existingLesson.videoKey ? deleteFromS3(existingLesson.videoKey) : Promise.resolve(),
          db
            .update(lessonsTable)
            .set({ videoKey: null, duration: 0 })
            .where(eq(lessonsTable.id, ctx.params.id))
            .returning(),
        ]);

        return { lesson: withUrls(updatedLesson) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Delete video from a lesson",
      },
    }
  )
  .post(
    "/:id/file",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload files",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        const allowedMimeTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];

        const mimeTypeMatch = ctx.body.file.match(/^data:([^;]+);base64,/);
        if (!mimeTypeMatch || !allowedMimeTypes.includes(mimeTypeMatch[1])) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "File must be a PDF, Word, Excel, or PowerPoint document",
            400
          );
        }

        const [, fileKey] = await Promise.all([
          existingLesson.fileKey ? deleteFromS3(existingLesson.fileKey) : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.file,
            folder: "files",
            userId: ctx.user.tenantId,
          }),
        ]);

        const [updatedLesson] = await db
          .update(lessonsTable)
          .set({
            fileKey,
            fileName: ctx.body.fileName,
            fileSize: ctx.body.fileSize,
            mimeType: mimeTypeMatch[1],
          })
          .where(eq(lessonsTable.id, ctx.params.id))
          .returning();

        return { lesson: withUrls(updatedLesson) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        file: t.String(),
        fileName: t.String({ minLength: 1 }),
        fileSize: t.Number({ minimum: 0 }),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Upload file for a lesson",
      },
    }
  )
  .delete(
    "/:id/file",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageLessons =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageLessons) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete files",
            403
          );
        }

        const [existingLesson] = await db
          .select()
          .from(lessonsTable)
          .where(
            and(
              eq(lessonsTable.id, ctx.params.id),
              eq(lessonsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingLesson) {
          throw new AppError(ErrorCode.NOT_FOUND, "Lesson not found", 404);
        }

        const [, [updatedLesson]] = await Promise.all([
          existingLesson.fileKey ? deleteFromS3(existingLesson.fileKey) : Promise.resolve(),
          db
            .update(lessonsTable)
            .set({ fileKey: null, fileName: null, fileSize: null, mimeType: null })
            .where(eq(lessonsTable.id, ctx.params.id))
            .returning(),
        ]);

        return { lesson: withUrls(updatedLesson) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Lessons"],
        summary: "Delete file from a lesson",
      },
    }
  );
