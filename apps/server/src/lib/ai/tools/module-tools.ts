import { tool } from "ai";
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  modulesTable,
  moduleItemsTable,
  courseModulesTable,
} from "@/db/schema";
import { eq, and, desc, sql, isNotNull, gt, inArray, count } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { generateEmbedding } from "../embeddings";
import {
  createModuleSchema,
  getModuleSchema,
  updateModuleMetadataSchema,
  updateModuleItemsSchema,
  deleteModuleSchema,
} from "./schemas";
import { SIMILARITY_THRESHOLDS, type ToolContext } from "./utils";

export function createModuleTools(ctx: ToolContext) {
  const { tenantId } = ctx;

  return {
    createModule: tool({
      description: "Create a new module with content items. Module is created as published. Returns existing module if similar one already exists.",
      inputSchema: createModuleSchema,
      execute: async ({ title, description, items }) => {
        const videoIds = items.filter((i) => i.type === "video").map((i) => i.id);
        const documentIds = items.filter((i) => i.type === "document").map((i) => i.id);
        const quizIds = items.filter((i) => i.type === "quiz").map((i) => i.id);

        const [validVideos, validDocuments, validQuizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id }).from(videosTable)
                .where(and(eq(videosTable.tenantId, tenantId), inArray(videosTable.id, videoIds)))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id }).from(documentsTable)
                .where(and(eq(documentsTable.tenantId, tenantId), inArray(documentsTable.id, documentIds)))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id }).from(quizzesTable)
                .where(and(eq(quizzesTable.tenantId, tenantId), inArray(quizzesTable.id, quizIds)))
            : [],
        ]);

        const validVideoIds = new Set(validVideos.map((v) => v.id));
        const validDocumentIds = new Set(validDocuments.map((d) => d.id));
        const validQuizIds = new Set(validQuizzes.map((q) => q.id));

        const validItems = items.filter((item) => {
          if (item.type === "video") return validVideoIds.has(item.id);
          if (item.type === "document") return validDocumentIds.has(item.id);
          if (item.type === "quiz") return validQuizIds.has(item.id);
          return false;
        });

        const invalidCount = items.length - validItems.length;
        if (invalidCount > 0) {
          logger.warn("createModule: filtered invalid item IDs", {
            title,
            totalItems: items.length,
            validItems: validItems.length,
            invalidCount,
          });
        }

        if (validItems.length === 0) {
          logger.error("createModule: no valid items provided", { title, items });
          return {
            type: "error" as const,
            error: "No valid content IDs provided. Use ACTUAL UUIDs from searchVideos/searchDocuments/searchQuizzes results.",
          };
        }

        const text = `${title} ${description || ""}`.trim();
        const queryEmbedding = await generateEmbedding(text);
        const similarity = sql<number>`1 - (${cosineDistance(modulesTable.embedding, queryEmbedding)})`;

        const existingModules = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            similarity,
          })
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.tenantId, tenantId),
              eq(modulesTable.status, "published"),
              isNotNull(modulesTable.embedding),
              gt(similarity, SIMILARITY_THRESHOLDS.DEDUP_CREATE)
            )
          )
          .orderBy(desc(similarity))
          .limit(1);

        if (existingModules.length > 0) {
          const existing = existingModules[0];
          logger.info("createModule: found existing similar module", {
            existingId: existing.id,
            existingTitle: existing.title,
            requestedTitle: title,
            similarity: existing.similarity,
          });

          const existingItems = await db
            .select({ id: moduleItemsTable.id })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, existing.id))
            .limit(1);

          if (existingItems.length === 0 && validItems.length > 0) {
            logger.info("createModule: existing module has no items, adding items", {
              moduleId: existing.id,
              itemCount: validItems.length,
            });

            for (const item of validItems) {
              await db.insert(moduleItemsTable).values({
                moduleId: existing.id,
                contentType: item.type,
                contentId: item.id,
                order: item.order,
                isPreview: item.isPreview ?? false,
              });
            }

            return {
              type: "module_reused" as const,
              id: existing.id,
              title: existing.title,
              itemsCount: validItems.length,
              alreadyExisted: true,
              itemsAdded: true,
              message: `Reutilice el modulo existente "${existing.title}" y le agregue ${validItems.length} items.`,
            };
          }

          return {
            type: "module_found_similar" as const,
            id: existing.id,
            title: existing.title,
            requestedTitle: title,
            itemsCount: existingItems.length,
            alreadyExisted: true,
            similarity: existing.similarity,
            message: `Ya existe un modulo muy similar: "${existing.title}". Puedes usarlo o crear uno nuevo con un nombre diferente.`,
          };
        }

        const [module] = await db
          .insert(modulesTable)
          .values({
            tenantId,
            title,
            description: description ?? null,
            status: "published",
          })
          .returning();

        await db
          .update(modulesTable)
          .set({ embedding: queryEmbedding })
          .where(eq(modulesTable.id, module.id));

        for (const item of validItems) {
          await db.insert(moduleItemsTable).values({
            moduleId: module.id,
            contentType: item.type,
            contentId: item.id,
            order: item.order,
            isPreview: item.isPreview ?? false,
          });
        }

        logger.info("createModule executed", {
          moduleId: module.id,
          itemCount: validItems.length,
        });

        return {
          id: module.id,
          title: module.title,
          itemsCount: validItems.length,
        };
      },
    }),

    getModule: tool({
      description: "Get a module with all its content items.",
      inputSchema: getModuleSchema,
      execute: async ({ moduleId }) => {
        const [module] = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            description: modulesTable.description,
            status: modulesTable.status,
          })
          .from(modulesTable)
          .where(and(eq(modulesTable.tenantId, tenantId), eq(modulesTable.id, moduleId)))
          .limit(1);

        if (!module) {
          return { type: "error" as const, error: "Module not found" };
        }

        const items = await db
          .select({
            id: moduleItemsTable.id,
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
            order: moduleItemsTable.order,
            isPreview: moduleItemsTable.isPreview,
          })
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.moduleId, moduleId))
          .orderBy(moduleItemsTable.order);

        const videoIds = items.filter((i) => i.contentType === "video").map((i) => i.contentId);
        const documentIds = items.filter((i) => i.contentType === "document").map((i) => i.contentId);
        const quizIds = items.filter((i) => i.contentType === "quiz").map((i) => i.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id, title: videosTable.title }).from(videosTable).where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id, title: documentsTable.title }).from(documentsTable).where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id, title: quizzesTable.title }).from(quizzesTable).where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const contentTitles = new Map<string, string>();
        for (const v of videos) contentTitles.set(v.id, v.title);
        for (const d of documents) contentTitles.set(d.id, d.title);
        for (const q of quizzes) contentTitles.set(q.id, q.title);

        const itemsWithTitles = items.map((item) => ({
          ...item,
          title: contentTitles.get(item.contentId) ?? "Unknown",
        }));

        logger.info("getModule executed", { moduleId, itemsCount: items.length });
        return { type: "module_details" as const, module: { ...module, items: itemsWithTitles } };
      },
    }),

    updateModule: tool({
      description: "Update a module's title, description, or status.",
      inputSchema: updateModuleMetadataSchema,
      execute: async ({ moduleId, title, description, status }) => {
        const [existing] = await db
          .select({ id: modulesTable.id })
          .from(modulesTable)
          .where(and(eq(modulesTable.tenantId, tenantId), eq(modulesTable.id, moduleId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Module not found" };
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0) {
          return { type: "error" as const, error: "No fields to update" };
        }

        await db.update(modulesTable).set(updateData).where(eq(modulesTable.id, moduleId));

        logger.info("updateModule executed", { moduleId, updatedFields: Object.keys(updateData) });
        return { type: "module_updated" as const, moduleId, updatedFields: Object.keys(updateData) };
      },
    }),

    updateModuleItems: tool({
      description: "Modify items in a module. Use mode='add' to add items (default), mode='remove' to remove items, mode='replace' to replace all items.",
      inputSchema: updateModuleItemsSchema,
      execute: async ({ moduleId, items, mode = "add" }) => {
        const [existingModule] = await db
          .select({ id: modulesTable.id, title: modulesTable.title })
          .from(modulesTable)
          .where(and(eq(modulesTable.id, moduleId), eq(modulesTable.tenantId, tenantId)))
          .limit(1);

        if (!existingModule) {
          return { type: "error" as const, error: "Module not found" };
        }

        const videoIds = items.filter((i) => i.contentType === "video").map((i) => i.contentId);
        const documentIds = items.filter((i) => i.contentType === "document").map((i) => i.contentId);
        const quizIds = items.filter((i) => i.contentType === "quiz").map((i) => i.contentId);

        const [validVideos, validDocuments, validQuizzes] = await Promise.all([
          videoIds.length > 0
            ? db.select({ id: videosTable.id }).from(videosTable).where(and(eq(videosTable.tenantId, tenantId), inArray(videosTable.id, videoIds)))
            : [],
          documentIds.length > 0
            ? db.select({ id: documentsTable.id }).from(documentsTable).where(and(eq(documentsTable.tenantId, tenantId), inArray(documentsTable.id, documentIds)))
            : [],
          quizIds.length > 0
            ? db.select({ id: quizzesTable.id }).from(quizzesTable).where(and(eq(quizzesTable.tenantId, tenantId), inArray(quizzesTable.id, quizIds)))
            : [],
        ]);

        const validVideoIds = new Set(validVideos.map((v) => v.id));
        const validDocumentIds = new Set(validDocuments.map((d) => d.id));
        const validQuizIds = new Set(validQuizzes.map((q) => q.id));

        const validItems = items.filter((item) => {
          if (item.contentType === "video") return validVideoIds.has(item.contentId);
          if (item.contentType === "document") return validDocumentIds.has(item.contentId);
          if (item.contentType === "quiz") return validQuizIds.has(item.contentId);
          return false;
        });

        if (validItems.length !== items.length) {
          const invalidCount = items.length - validItems.length;
          logger.warn("updateModuleItems: filtered invalid items", { moduleId, invalidCount, mode });
        }

        if (mode === "remove") {
          if (validItems.length === 0) {
            return { type: "error" as const, error: "No valid items to remove" };
          }
          const contentIdsToRemove = validItems.map((i) => i.contentId);
          await db.delete(moduleItemsTable).where(
            and(
              eq(moduleItemsTable.moduleId, moduleId),
              inArray(moduleItemsTable.contentId, contentIdsToRemove)
            )
          );
          logger.info("updateModuleItems: items removed", { moduleId, removedCount: validItems.length });
          return {
            type: "module_items_removed" as const,
            moduleId,
            moduleTitle: existingModule.title,
            removedCount: validItems.length,
          };
        }

        if (mode === "add") {
          const existingItems = await db
            .select({ order: moduleItemsTable.order })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, moduleId));

          const maxOrder = existingItems.length > 0
            ? Math.max(...existingItems.map((i) => i.order))
            : -1;

          if (validItems.length > 0) {
            await db.insert(moduleItemsTable).values(
              validItems.map((item, idx) => ({
                moduleId,
                contentType: item.contentType,
                contentId: item.contentId,
                order: item.order ?? maxOrder + idx + 1,
                isPreview: item.isPreview ?? false,
              }))
            );
          }

          logger.info("updateModuleItems: items added", { moduleId, addedCount: validItems.length });
          return {
            type: "module_items_added" as const,
            moduleId,
            moduleTitle: existingModule.title,
            addedCount: validItems.length,
            totalItems: existingItems.length + validItems.length,
          };
        }

        await db.delete(moduleItemsTable).where(eq(moduleItemsTable.moduleId, moduleId));

        if (validItems.length > 0) {
          await db.insert(moduleItemsTable).values(
            validItems.map((item, idx) => ({
              moduleId,
              contentType: item.contentType,
              contentId: item.contentId,
              order: item.order ?? idx,
              isPreview: item.isPreview ?? false,
            }))
          );
        }

        logger.info("updateModuleItems: items replaced", { moduleId, itemsCount: validItems.length });
        return {
          type: "module_items_replaced" as const,
          moduleId,
          moduleTitle: existingModule.title,
          itemsCount: validItems.length,
        };
      },
    }),

    deleteModule: tool({
      description: "Delete a module and all its items. Requires confirmation.",
      inputSchema: deleteModuleSchema,
      execute: async ({ moduleId, confirmed }) => {
        const [existing] = await db
          .select({ id: modulesTable.id, title: modulesTable.title })
          .from(modulesTable)
          .where(and(eq(modulesTable.tenantId, tenantId), eq(modulesTable.id, moduleId)))
          .limit(1);

        if (!existing) {
          return { type: "error" as const, error: "Module not found" };
        }

        const [courseUsage] = await db
          .select({ count: count() })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.moduleId, moduleId));

        if (!confirmed) {
          return {
            type: "confirmation_required" as const,
            action: "delete_module",
            moduleId,
            moduleTitle: existing.title,
            message: `Are you sure you want to delete module "${existing.title}"?`,
            warning: courseUsage.count > 0 ? `This module is used in ${courseUsage.count} courses.` : undefined,
          };
        }

        await db.delete(modulesTable).where(eq(modulesTable.id, moduleId));

        logger.info("deleteModule executed", { moduleId, title: existing.title });
        return { type: "module_deleted" as const, moduleId, title: existing.title };
      },
    }),
  };
}
