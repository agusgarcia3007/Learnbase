import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { getPresignedUrl } from "@/lib/upload";
import {
  coursesTable,
  courseModulesTable,
  modulesTable,
  moduleItemsTable,
  enrollmentsTable,
  itemProgressTable,
  videosTable,
  documentsTable,
  quizzesTable,
  quizQuestionsTable,
  quizOptionsTable,
} from "@/db/schema";
import { eq, and, count, inArray, asc } from "drizzle-orm";

type ItemProgressStatus = "not_started" | "in_progress" | "completed";

type ModuleItemWithProgress = {
  id: string;
  title: string;
  contentType: "video" | "document" | "quiz";
  order: number;
  duration?: number;
  status: ItemProgressStatus;
  videoProgress?: number;
};

type ModuleWithItems = {
  id: string;
  title: string;
  order: number;
  items: ModuleItemWithProgress[];
};

function findResumeItemId(modules: ModuleWithItems[]): string | null {
  for (const module of modules) {
    for (const item of module.items) {
      if (item.status === "in_progress" && item.contentType === "video") {
        return item.id;
      }
    }
  }
  for (const module of modules) {
    for (const item of module.items) {
      if (item.status === "not_started") {
        return item.id;
      }
    }
  }
  return modules[0]?.items[0]?.id ?? null;
}

async function recalculateEnrollmentProgress(enrollmentId: string): Promise<number> {
  const [totalResult] = await db
    .select({ total: count() })
    .from(itemProgressTable)
    .where(eq(itemProgressTable.enrollmentId, enrollmentId));

  const [completedResult] = await db
    .select({ completed: count() })
    .from(itemProgressTable)
    .where(
      and(
        eq(itemProgressTable.enrollmentId, enrollmentId),
        eq(itemProgressTable.status, "completed")
      )
    );

  const total = totalResult?.total ?? 0;
  const completed = completedResult?.completed ?? 0;

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export const learnRoutes = new Elysia({ name: "learn" })
  .use(authPlugin)
  .get(
    "/courses/:courseSlug/structure",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [courseResult] = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            slug: coursesTable.slug,
            thumbnail: coursesTable.thumbnail,
          })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.slug, ctx.params.courseSlug),
              eq(coursesTable.status, "published")
            )
          )
          .limit(1);

        if (!courseResult) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, courseResult.id)
            )
          )
          .limit(1);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled in this course", 403);
        }

        const courseModules = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
            order: courseModulesTable.order,
          })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(eq(courseModulesTable.courseId, courseResult.id))
          .orderBy(asc(courseModulesTable.order));

        const moduleIds = courseModules.map((m) => m.id);

        const allModuleItems =
          moduleIds.length > 0
            ? await db
                .select({
                  id: moduleItemsTable.id,
                  moduleId: moduleItemsTable.moduleId,
                  contentType: moduleItemsTable.contentType,
                  contentId: moduleItemsTable.contentId,
                  order: moduleItemsTable.order,
                })
                .from(moduleItemsTable)
                .where(inArray(moduleItemsTable.moduleId, moduleIds))
                .orderBy(asc(moduleItemsTable.order))
            : [];

        const moduleItemIds = allModuleItems.map((mi) => mi.id);

        const existingProgress =
          moduleItemIds.length > 0
            ? await db
                .select({
                  moduleItemId: itemProgressTable.moduleItemId,
                  status: itemProgressTable.status,
                  videoProgress: itemProgressTable.videoProgress,
                })
                .from(itemProgressTable)
                .where(
                  and(
                    eq(itemProgressTable.enrollmentId, enrollment.id),
                    inArray(itemProgressTable.moduleItemId, moduleItemIds)
                  )
                )
            : [];

        const progressMap = new Map(
          existingProgress.map((p) => [
            p.moduleItemId,
            { status: p.status, videoProgress: p.videoProgress },
          ])
        );

        const missingItemIds = moduleItemIds.filter((id) => !progressMap.has(id));
        if (missingItemIds.length > 0) {
          await db.insert(itemProgressTable).values(
            missingItemIds.map((moduleItemId) => ({
              enrollmentId: enrollment.id,
              moduleItemId,
              status: "not_started" as const,
            }))
          );
          for (const id of missingItemIds) {
            progressMap.set(id, { status: "not_started", videoProgress: 0 });
          }
        }

        const videoIds = allModuleItems
          .filter((item) => item.contentType === "video")
          .map((item) => item.contentId);
        const documentIds = allModuleItems
          .filter((item) => item.contentType === "document")
          .map((item) => item.contentId);
        const quizIds = allModuleItems
          .filter((item) => item.contentType === "quiz")
          .map((item) => item.contentId);

        const [videos, documents, quizzes] = await Promise.all([
          videoIds.length > 0
            ? db
                .select({
                  id: videosTable.id,
                  title: videosTable.title,
                  duration: videosTable.duration,
                })
                .from(videosTable)
                .where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db
                .select({
                  id: documentsTable.id,
                  title: documentsTable.title,
                })
                .from(documentsTable)
                .where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db
                .select({
                  id: quizzesTable.id,
                  title: quizzesTable.title,
                })
                .from(quizzesTable)
                .where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const contentMap = new Map<string, { title: string; duration?: number }>();
        for (const v of videos) contentMap.set(v.id, { title: v.title, duration: v.duration });
        for (const d of documents) contentMap.set(d.id, { title: d.title });
        for (const q of quizzes) contentMap.set(q.id, { title: q.title });

        const modules: ModuleWithItems[] = courseModules.map((module) => {
          const items = allModuleItems
            .filter((item) => item.moduleId === module.id)
            .map((item) => {
              const content = contentMap.get(item.contentId);
              const progress = progressMap.get(item.id);
              return {
                id: item.id,
                title: content?.title ?? "Untitled",
                contentType: item.contentType as "video" | "document" | "quiz",
                order: item.order,
                duration: content?.duration,
                status: (progress?.status ?? "not_started") as ItemProgressStatus,
                videoProgress: progress?.videoProgress ?? undefined,
              };
            });

          return {
            id: module.id,
            title: module.title,
            order: module.order,
            items,
          };
        });

        const resumeItemId = findResumeItemId(modules);

        return {
          course: {
            id: courseResult.id,
            title: courseResult.title,
            slug: courseResult.slug,
            thumbnail: courseResult.thumbnail
              ? getPresignedUrl(courseResult.thumbnail)
              : null,
          },
          enrollment: {
            id: enrollment.id,
            progress: enrollment.progress,
            status: enrollment.status,
          },
          modules,
          resumeItemId,
        };
      }),
    {
      params: t.Object({
        courseSlug: t.String(),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Get course structure with progress",
      },
    }
  )
  .get(
    "/items/:moduleItemId/content",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [moduleItem] = await db
          .select()
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.id, ctx.params.moduleItemId))
          .limit(1);

        if (!moduleItem) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not found", 404);
        }

        const [module] = await db
          .select()
          .from(modulesTable)
          .where(eq(modulesTable.id, moduleItem.moduleId))
          .limit(1);

        if (!module || module.tenantId !== ctx.user.tenantId) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [courseModule] = await db
          .select({ courseId: courseModulesTable.courseId })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.moduleId, module.id))
          .limit(1);

        if (!courseModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, courseModule.courseId)
            )
          )
          .limit(1);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled", 403);
        }

        const [progress] = await db
          .select()
          .from(itemProgressTable)
          .where(
            and(
              eq(itemProgressTable.enrollmentId, enrollment.id),
              eq(itemProgressTable.moduleItemId, moduleItem.id)
            )
          )
          .limit(1);

        if (moduleItem.contentType === "video") {
          const [video] = await db
            .select()
            .from(videosTable)
            .where(eq(videosTable.id, moduleItem.contentId))
            .limit(1);

          if (!video) {
            throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
          }

          return {
            type: "video" as const,
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.videoKey ? getPresignedUrl(video.videoKey) : null,
            duration: video.duration,
            videoProgress: progress?.videoProgress ?? 0,
          };
        }

        if (moduleItem.contentType === "document") {
          const [document] = await db
            .select()
            .from(documentsTable)
            .where(eq(documentsTable.id, moduleItem.contentId))
            .limit(1);

          if (!document) {
            throw new AppError(ErrorCode.NOT_FOUND, "Document not found", 404);
          }

          return {
            type: "document" as const,
            id: document.id,
            title: document.title,
            description: document.description,
            url: document.fileKey ? getPresignedUrl(document.fileKey) : null,
            mimeType: document.mimeType,
            fileName: document.fileName,
          };
        }

        if (moduleItem.contentType === "quiz") {
          const [quiz] = await db
            .select()
            .from(quizzesTable)
            .where(eq(quizzesTable.id, moduleItem.contentId))
            .limit(1);

          if (!quiz) {
            throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
          }

          const questions = await db
            .select()
            .from(quizQuestionsTable)
            .where(eq(quizQuestionsTable.quizId, quiz.id))
            .orderBy(asc(quizQuestionsTable.order));

          const questionIds = questions.map((q) => q.id);
          const options =
            questionIds.length > 0
              ? await db
                  .select()
                  .from(quizOptionsTable)
                  .where(inArray(quizOptionsTable.questionId, questionIds))
                  .orderBy(asc(quizOptionsTable.order))
              : [];

          const optionsByQuestion = new Map<string, typeof options>();
          for (const opt of options) {
            const existing = optionsByQuestion.get(opt.questionId) ?? [];
            existing.push(opt);
            optionsByQuestion.set(opt.questionId, existing);
          }

          return {
            type: "quiz" as const,
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            questions: questions.map((q) => ({
              id: q.id,
              type: q.type,
              questionText: q.questionText,
              explanation: q.explanation,
              order: q.order,
              options: (optionsByQuestion.get(q.id) ?? []).map((o) => ({
                id: o.id,
                optionText: o.optionText,
                order: o.order,
              })),
            })),
          };
        }

        throw new AppError(ErrorCode.BAD_REQUEST, "Invalid content type", 400);
      }),
    {
      params: t.Object({
        moduleItemId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Get item content for playback",
      },
    }
  )
  .patch(
    "/items/:moduleItemId/progress",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [moduleItem] = await db
          .select({ id: moduleItemsTable.id, moduleId: moduleItemsTable.moduleId })
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.id, ctx.params.moduleItemId))
          .limit(1);

        if (!moduleItem) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not found", 404);
        }

        const [courseModule] = await db
          .select({ courseId: courseModulesTable.courseId })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.moduleId, moduleItem.moduleId))
          .limit(1);

        if (!courseModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, courseModule.courseId)
            )
          )
          .limit(1);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled", 403);
        }

        const { videoProgress, status } = ctx.body;

        const updateData: { videoProgress?: number; status?: ItemProgressStatus } = {};
        if (typeof videoProgress === "number") {
          updateData.videoProgress = videoProgress;
        }
        if (status === "in_progress") {
          updateData.status = "in_progress";
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(itemProgressTable)
            .set(updateData)
            .where(
              and(
                eq(itemProgressTable.enrollmentId, enrollment.id),
                eq(itemProgressTable.moduleItemId, moduleItem.id)
              )
            );
        }

        return { success: true };
      }),
    {
      params: t.Object({
        moduleItemId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        videoProgress: t.Optional(t.Number({ minimum: 0 })),
        status: t.Optional(t.Literal("in_progress")),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Update item progress (debounced video save)",
      },
    }
  )
  .post(
    "/items/:moduleItemId/complete",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [moduleItem] = await db
          .select({ id: moduleItemsTable.id, moduleId: moduleItemsTable.moduleId })
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.id, ctx.params.moduleItemId))
          .limit(1);

        if (!moduleItem) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not found", 404);
        }

        const [courseModule] = await db
          .select({ courseId: courseModulesTable.courseId })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.moduleId, moduleItem.moduleId))
          .limit(1);

        if (!courseModule) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, courseModule.courseId)
            )
          )
          .limit(1);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled", 403);
        }

        await db
          .update(itemProgressTable)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(itemProgressTable.enrollmentId, enrollment.id),
              eq(itemProgressTable.moduleItemId, moduleItem.id)
            )
          );

        const newProgress = await recalculateEnrollmentProgress(enrollment.id);

        const enrollmentUpdate: { progress: number; status?: "completed"; completedAt?: Date } = {
          progress: newProgress,
        };

        if (newProgress === 100) {
          enrollmentUpdate.status = "completed";
          enrollmentUpdate.completedAt = new Date();
        }

        await db
          .update(enrollmentsTable)
          .set(enrollmentUpdate)
          .where(eq(enrollmentsTable.id, enrollment.id));

        return {
          success: true,
          progress: newProgress,
          courseCompleted: newProgress === 100,
        };
      }),
    {
      params: t.Object({
        moduleItemId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Mark item as complete",
      },
    }
  );
