import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  documentsTable,
  contentStatusEnum,
  moduleItemsTable,
  type SelectDocument,
} from "@/db/schema";
import { count, eq, and } from "drizzle-orm";
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

async function updateDocumentEmbedding(documentId: string, title: string, description: string | null) {
  const text = `${title} ${description || ""}`.trim();
  const embedding = await generateEmbedding(text);
  await db.update(documentsTable).set({ embedding }).where(eq(documentsTable.id, documentId));
}

const documentFieldMap: FieldMap<typeof documentsTable> = {
  id: documentsTable.id,
  title: documentsTable.title,
  status: documentsTable.status,
  createdAt: documentsTable.createdAt,
  updatedAt: documentsTable.updatedAt,
};

const documentSearchableFields: SearchableFields<typeof documentsTable> = [
  documentsTable.title,
];

const documentDateFields: DateFields = new Set(["createdAt"]);

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function withUrl(document: SelectDocument): SelectDocument & { fileUrl: string | null } {
  return {
    ...document,
    fileUrl: document.fileKey ? getPresignedUrl(document.fileKey) : null,
  };
}

export const documentsRoutes = new Elysia()
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
            "Only owners and admins can upload documents",
            403
          );
        }

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
          folder: "documents",
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
        tags: ["Documents"],
        summary: "Upload document file (returns key to use when creating/updating)",
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
            "Only owners and admins can manage documents",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          documentFieldMap,
          documentSearchableFields,
          documentDateFields
        );

        const tenantFilter = eq(documentsTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, documentFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select()
          .from(documentsTable);

        let query = baseQuery.$dynamic();
        query = query.where(whereClause);
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(documentsTable)
          .where(whereClause);

        const [documents, [{ count: total }]] = await Promise.all([
          query,
          countQuery,
        ]);

        return {
          documents: documents.map(withUrl),
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
        tags: ["Documents"],
        summary: "List documents with pagination and filters",
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

        const [document] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, ctx.params.id),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!document) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        return { document: withUrl(document) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Documents"],
        summary: "Get document by ID",
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
            "Only owners and admins can create documents",
            403
          );
        }

        const [document] = await db
          .insert(documentsTable)
          .values({
            tenantId: ctx.user.tenantId,
            title: ctx.body.title,
            description: ctx.body.description,
            fileKey: ctx.body.fileKey,
            fileName: ctx.body.fileName,
            fileSize: ctx.body.fileSize,
            mimeType: ctx.body.mimeType,
            status: ctx.body.status ?? "draft",
          })
          .returning();

        updateDocumentEmbedding(document.id, document.title, document.description ?? null).catch(() => {});

        return { document: withUrl(document) };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        fileKey: t.Optional(t.String()),
        fileName: t.Optional(t.String()),
        fileSize: t.Optional(t.Number({ minimum: 0 })),
        mimeType: t.Optional(t.String()),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Documents"],
        summary: "Create a new document",
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
            "Only owners and admins can update documents",
            403
          );
        }

        const [existingDocument] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, ctx.params.id),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingDocument) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        if (ctx.body.fileKey !== undefined && existingDocument.fileKey && ctx.body.fileKey !== existingDocument.fileKey) {
          await deleteFromS3(existingDocument.fileKey);
        }

        const updateData: Partial<SelectDocument> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.description !== undefined) updateData.description = ctx.body.description;
        if (ctx.body.fileKey !== undefined) updateData.fileKey = ctx.body.fileKey;
        if (ctx.body.fileName !== undefined) updateData.fileName = ctx.body.fileName;
        if (ctx.body.fileSize !== undefined) updateData.fileSize = ctx.body.fileSize;
        if (ctx.body.mimeType !== undefined) updateData.mimeType = ctx.body.mimeType;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;

        const [updatedDocument] = await db
          .update(documentsTable)
          .set(updateData)
          .where(eq(documentsTable.id, ctx.params.id))
          .returning();

        if (ctx.body.title !== undefined || ctx.body.description !== undefined) {
          updateDocumentEmbedding(
            updatedDocument.id,
            updatedDocument.title,
            updatedDocument.description ?? null
          ).catch(() => {});
        }

        return { document: withUrl(updatedDocument) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        fileKey: t.Optional(t.Union([t.String(), t.Null()])),
        fileName: t.Optional(t.Union([t.String(), t.Null()])),
        fileSize: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        mimeType: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Documents"],
        summary: "Update a document",
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
            "Only owners and admins can delete documents",
            403
          );
        }

        const [existingDocument] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, ctx.params.id),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingDocument) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        await db
          .delete(moduleItemsTable)
          .where(
            and(
              eq(moduleItemsTable.contentType, "document"),
              eq(moduleItemsTable.contentId, ctx.params.id)
            )
          );

        await Promise.all([
          existingDocument.fileKey ? deleteFromS3(existingDocument.fileKey) : Promise.resolve(),
          db.delete(documentsTable).where(eq(documentsTable.id, ctx.params.id)),
        ]);

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Documents"],
        summary: "Delete a document",
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

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can upload documents",
            403
          );
        }

        const [existingDocument] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, ctx.params.id),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingDocument) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        const mimeTypeMatch = ctx.body.file.match(/^data:([^;]+);base64,/);
        if (!mimeTypeMatch || !allowedMimeTypes.includes(mimeTypeMatch[1])) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "File must be a PDF, Word, Excel, or PowerPoint document",
            400
          );
        }

        const [, fileKey] = await Promise.all([
          existingDocument.fileKey ? deleteFromS3(existingDocument.fileKey) : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.file,
            folder: "documents",
            userId: ctx.user.tenantId,
          }),
        ]);

        const [updatedDocument] = await db
          .update(documentsTable)
          .set({
            fileKey,
            fileName: ctx.body.fileName,
            fileSize: ctx.body.fileSize,
            mimeType: mimeTypeMatch[1],
          })
          .where(eq(documentsTable.id, ctx.params.id))
          .returning();

        return { document: withUrl(updatedDocument) };
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
        tags: ["Documents"],
        summary: "Upload file for a document record",
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

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete documents",
            403
          );
        }

        const [existingDocument] = await db
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.id, ctx.params.id),
              eq(documentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingDocument) {
          throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
        }

        const [, [updatedDocument]] = await Promise.all([
          existingDocument.fileKey ? deleteFromS3(existingDocument.fileKey) : Promise.resolve(),
          db
            .update(documentsTable)
            .set({ fileKey: null, fileName: null, fileSize: null, mimeType: null })
            .where(eq(documentsTable.id, ctx.params.id))
            .returning(),
        ]);

        return { document: withUrl(updatedDocument) };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Documents"],
        summary: "Delete file from a document record",
      },
    }
  );
