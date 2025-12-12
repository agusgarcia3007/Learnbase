import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import { getPresignedUrl } from "@/lib/upload";
import { generateAndStoreCertificate } from "@/lib/certificate";
import { logger } from "@/lib/logger";
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
  instructorsTable,
} from "@/db/schema";
import { eq, and, count, inArray, asc, sql, ne, notInArray } from "drizzle-orm";

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

type ModuleLite = {
  id: string;
  title: string;
  order: number;
  itemsCount: number;
};

async function findResumeItemId(
  enrollmentId: string,
  moduleIds: string[]
): Promise<string | null> {
  if (moduleIds.length === 0) return null;

  const [inProgressVideo] = await db
    .select({ id: moduleItemsTable.id })
    .from(moduleItemsTable)
    .innerJoin(
      itemProgressTable,
      eq(itemProgressTable.moduleItemId, moduleItemsTable.id)
    )
    .where(
      and(
        inArray(moduleItemsTable.moduleId, moduleIds),
        eq(itemProgressTable.enrollmentId, enrollmentId),
        eq(itemProgressTable.status, "in_progress"),
        eq(moduleItemsTable.contentType, "video")
      )
    )
    .orderBy(asc(moduleItemsTable.order))
    .limit(1);

  if (inProgressVideo) return inProgressVideo.id;

  const [notStarted] = await db
    .select({ id: moduleItemsTable.id })
    .from(moduleItemsTable)
    .innerJoin(
      itemProgressTable,
      eq(itemProgressTable.moduleItemId, moduleItemsTable.id)
    )
    .where(
      and(
        inArray(moduleItemsTable.moduleId, moduleIds),
        eq(itemProgressTable.enrollmentId, enrollmentId),
        eq(itemProgressTable.status, "not_started")
      )
    )
    .orderBy(asc(moduleItemsTable.order))
    .limit(1);

  if (notStarted) return notStarted.id;

  const [firstItem] = await db
    .select({ id: moduleItemsTable.id })
    .from(moduleItemsTable)
    .where(inArray(moduleItemsTable.moduleId, moduleIds))
    .orderBy(asc(moduleItemsTable.order))
    .limit(1);

  return firstItem?.id ?? null;
}

async function recalculateEnrollmentProgress(enrollmentId: string): Promise<number> {
  const [result] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${itemProgressTable.status} = 'completed')`,
    })
    .from(itemProgressTable)
    .where(eq(itemProgressTable.enrollmentId, enrollmentId));

  const total = result?.total ?? 0;
  const completed = result?.completed ?? 0;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

async function getEnrollmentForItem(
  userId: string,
  tenantId: string,
  moduleItemId: string
) {
  const [result] = await db
    .select({
      moduleItemId: moduleItemsTable.id,
      contentType: moduleItemsTable.contentType,
      contentId: moduleItemsTable.contentId,
      enrollmentId: enrollmentsTable.id,
      enrollmentStatus: enrollmentsTable.status,
      courseId: courseModulesTable.courseId,
      courseIncludeCertificate: coursesTable.includeCertificate,
    })
    .from(moduleItemsTable)
    .innerJoin(modulesTable, eq(moduleItemsTable.moduleId, modulesTable.id))
    .innerJoin(courseModulesTable, eq(modulesTable.id, courseModulesTable.moduleId))
    .innerJoin(coursesTable, eq(coursesTable.id, courseModulesTable.courseId))
    .innerJoin(
      enrollmentsTable,
      and(
        eq(enrollmentsTable.courseId, courseModulesTable.courseId),
        eq(enrollmentsTable.userId, userId)
      )
    )
    .where(
      and(
        eq(moduleItemsTable.id, moduleItemId),
        eq(modulesTable.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!result) {
    throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled or item not found", 403);
  }
  return result;
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

        const [[enrollment], courseModulesRaw] = await Promise.all([
          db
            .select({
              id: enrollmentsTable.id,
              progress: enrollmentsTable.progress,
              status: enrollmentsTable.status,
            })
            .from(enrollmentsTable)
            .where(
              and(
                eq(enrollmentsTable.userId, ctx.user.id),
                eq(enrollmentsTable.courseId, courseResult.id)
              )
            )
            .limit(1),
          db
            .select({
              id: modulesTable.id,
              title: modulesTable.title,
              order: courseModulesTable.order,
              itemsCount: sql<number>`cast(count(${moduleItemsTable.id}) as int)`,
            })
            .from(courseModulesTable)
            .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
            .leftJoin(moduleItemsTable, eq(moduleItemsTable.moduleId, modulesTable.id))
            .where(eq(courseModulesTable.courseId, courseResult.id))
            .groupBy(modulesTable.id, courseModulesTable.order)
            .orderBy(asc(courseModulesTable.order)),
        ]);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled in this course", 403);
        }

        const modules: ModuleLite[] = courseModulesRaw.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          itemsCount: m.itemsCount,
        }));

        const moduleIds = modules.map((m) => m.id);
        const resumeItemId = await findResumeItemId(enrollment.id, moduleIds);

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
    "/courses/:courseSlug/progress",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [courseResult] = await db
          .select({ id: coursesTable.id })
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
          .select({ id: enrollmentsTable.id })
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

        const moduleIds = await db
          .select({ id: modulesTable.id })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(eq(courseModulesTable.courseId, courseResult.id));

        if (moduleIds.length === 0) {
          return {
            totalItems: 0,
            completedItems: 0,
            moduleProgress: [],
          };
        }

        const ids = moduleIds.map((m) => m.id);

        const progressData = await db
          .select({
            moduleId: moduleItemsTable.moduleId,
            total: sql<number>`cast(count(*) as int)`,
            completed: sql<number>`cast(count(*) filter (where ${itemProgressTable.status} = 'completed') as int)`,
          })
          .from(moduleItemsTable)
          .leftJoin(
            itemProgressTable,
            and(
              eq(itemProgressTable.moduleItemId, moduleItemsTable.id),
              eq(itemProgressTable.enrollmentId, enrollment.id)
            )
          )
          .where(inArray(moduleItemsTable.moduleId, ids))
          .groupBy(moduleItemsTable.moduleId);

        const moduleProgress = progressData.map((p) => ({
          moduleId: p.moduleId,
          completed: p.completed,
          total: p.total,
        }));

        const totalItems = moduleProgress.reduce((sum, p) => sum + p.total, 0);
        const completedItems = moduleProgress.reduce((sum, p) => sum + p.completed, 0);

        const allItemIds = await db
          .select({
            id: moduleItemsTable.id,
            moduleId: moduleItemsTable.moduleId,
          })
          .from(moduleItemsTable)
          .innerJoin(
            courseModulesTable,
            eq(moduleItemsTable.moduleId, courseModulesTable.moduleId)
          )
          .where(eq(courseModulesTable.courseId, courseResult.id))
          .orderBy(asc(courseModulesTable.order), asc(moduleItemsTable.order));

        return {
          totalItems,
          completedItems,
          moduleProgress,
          itemIds: allItemIds.map((i) => ({ id: i.id, moduleId: i.moduleId })),
        };
      }),
    {
      params: t.Object({
        courseSlug: t.String(),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Get aggregated progress per module",
      },
    }
  )
  .get(
    "/modules/:moduleId/items",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [moduleCheck] = await db
          .select({
            moduleId: modulesTable.id,
            courseId: courseModulesTable.courseId,
          })
          .from(modulesTable)
          .innerJoin(courseModulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(
            and(
              eq(modulesTable.id, ctx.params.moduleId),
              eq(modulesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!moduleCheck) {
          throw new AppError(ErrorCode.NOT_FOUND, "Module not found", 404);
        }

        const [enrollment] = await db
          .select({ id: enrollmentsTable.id })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, moduleCheck.courseId)
            )
          )
          .limit(1);

        if (!enrollment) {
          throw new AppError(ErrorCode.FORBIDDEN, "Not enrolled in this course", 403);
        }

        const moduleItems = await db
          .select({
            id: moduleItemsTable.id,
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
            order: moduleItemsTable.order,
          })
          .from(moduleItemsTable)
          .where(eq(moduleItemsTable.moduleId, ctx.params.moduleId))
          .orderBy(asc(moduleItemsTable.order));

        if (moduleItems.length === 0) {
          return { items: [] };
        }

        const moduleItemIds = moduleItems.map((mi) => mi.id);

        const existingProgress = await db
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
          );

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

        const videoIds = moduleItems
          .filter((item) => item.contentType === "video")
          .map((item) => item.contentId);
        const documentIds = moduleItems
          .filter((item) => item.contentType === "document")
          .map((item) => item.contentId);
        const quizIds = moduleItems
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

        const items: ModuleItemWithProgress[] = moduleItems.map((item) => {
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

        return { items };
      }),
    {
      params: t.Object({
        moduleId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Get module items with progress (lazy load)",
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
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const item = await getEnrollmentForItem(
          ctx.user.id,
          ctx.user.tenantId,
          ctx.params.moduleItemId
        );

        if (item.contentType === "video") {
          const [[progress], [video]] = await Promise.all([
            db
              .select({ videoProgress: itemProgressTable.videoProgress })
              .from(itemProgressTable)
              .where(
                and(
                  eq(itemProgressTable.enrollmentId, item.enrollmentId),
                  eq(itemProgressTable.moduleItemId, item.moduleItemId)
                )
              )
              .limit(1),
            db
              .select({
                id: videosTable.id,
                title: videosTable.title,
                description: videosTable.description,
                videoKey: videosTable.videoKey,
                duration: videosTable.duration,
              })
              .from(videosTable)
              .where(eq(videosTable.id, item.contentId))
              .limit(1),
          ]);

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

        if (item.contentType === "document") {
          const [document] = await db
            .select({
              id: documentsTable.id,
              title: documentsTable.title,
              description: documentsTable.description,
              fileKey: documentsTable.fileKey,
              mimeType: documentsTable.mimeType,
              fileName: documentsTable.fileName,
            })
            .from(documentsTable)
            .where(eq(documentsTable.id, item.contentId))
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

        if (item.contentType === "quiz") {
          const [[quiz], questions] = await Promise.all([
            db
              .select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                description: quizzesTable.description,
              })
              .from(quizzesTable)
              .where(eq(quizzesTable.id, item.contentId))
              .limit(1),
            db
              .select({
                id: quizQuestionsTable.id,
                quizId: quizQuestionsTable.quizId,
                type: quizQuestionsTable.type,
                questionText: quizQuestionsTable.questionText,
                explanation: quizQuestionsTable.explanation,
                order: quizQuestionsTable.order,
              })
              .from(quizQuestionsTable)
              .where(eq(quizQuestionsTable.quizId, item.contentId))
              .orderBy(asc(quizQuestionsTable.order)),
          ]);

          if (!quiz) {
            throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
          }

          const questionIds = questions.map((q) => q.id);
          const options =
            questionIds.length > 0
              ? await db
                  .select({
                    id: quizOptionsTable.id,
                    questionId: quizOptionsTable.questionId,
                    optionText: quizOptionsTable.optionText,
                    order: quizOptionsTable.order,
                  })
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
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const item = await getEnrollmentForItem(
          ctx.user.id,
          ctx.user.tenantId,
          ctx.params.moduleItemId
        );

        if (item.enrollmentStatus === "completed") {
          return { success: true };
        }

        const { videoProgress, status } = ctx.body;

        const [currentProgress] = await db
          .select({ status: itemProgressTable.status })
          .from(itemProgressTable)
          .where(
            and(
              eq(itemProgressTable.enrollmentId, item.enrollmentId),
              eq(itemProgressTable.moduleItemId, item.moduleItemId)
            )
          )
          .limit(1);

        if (currentProgress?.status === "completed") {
          return { success: true };
        }

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
                eq(itemProgressTable.enrollmentId, item.enrollmentId),
                eq(itemProgressTable.moduleItemId, item.moduleItemId)
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
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const item = await getEnrollmentForItem(
          ctx.user.id,
          ctx.user.tenantId,
          ctx.params.moduleItemId
        );

        await db
          .update(itemProgressTable)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(itemProgressTable.enrollmentId, item.enrollmentId),
              eq(itemProgressTable.moduleItemId, item.moduleItemId)
            )
          );

        const newProgress = await recalculateEnrollmentProgress(item.enrollmentId);

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
          .where(eq(enrollmentsTable.id, item.enrollmentId));

        if (newProgress === 100 && item.courseIncludeCertificate) {
          generateAndStoreCertificate({
            enrollmentId: item.enrollmentId,
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
          }).catch((err) =>
            logger.error("Certificate generation failed", { error: err })
          );
        }

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
  )
  .post(
    "/items/:moduleItemId/toggle-complete",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const item = await getEnrollmentForItem(
          ctx.user.id,
          ctx.user.tenantId,
          ctx.params.moduleItemId
        );

        const [currentProgress] = await db
          .select({ status: itemProgressTable.status })
          .from(itemProgressTable)
          .where(
            and(
              eq(itemProgressTable.enrollmentId, item.enrollmentId),
              eq(itemProgressTable.moduleItemId, item.moduleItemId)
            )
          )
          .limit(1);

        const wasCompleted = currentProgress?.status === "completed";
        const newStatus = wasCompleted ? "not_started" : "completed";

        await db
          .update(itemProgressTable)
          .set({
            status: newStatus,
            completedAt: wasCompleted ? null : new Date(),
            videoProgress: wasCompleted ? 0 : undefined,
          })
          .where(
            and(
              eq(itemProgressTable.enrollmentId, item.enrollmentId),
              eq(itemProgressTable.moduleItemId, item.moduleItemId)
            )
          );

        const newProgress = await recalculateEnrollmentProgress(item.enrollmentId);

        const enrollmentUpdate: {
          progress: number;
          status?: "active" | "completed";
          completedAt?: Date | null;
        } = { progress: newProgress };

        if (newProgress === 100 && !wasCompleted) {
          enrollmentUpdate.status = "completed";
          enrollmentUpdate.completedAt = new Date();
        } else if (wasCompleted && newProgress < 100) {
          enrollmentUpdate.status = "active";
          enrollmentUpdate.completedAt = null;
        }

        await db
          .update(enrollmentsTable)
          .set(enrollmentUpdate)
          .where(eq(enrollmentsTable.id, item.enrollmentId));

        if (newProgress === 100 && !wasCompleted && item.courseIncludeCertificate) {
          generateAndStoreCertificate({
            enrollmentId: item.enrollmentId,
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
          }).catch((err) =>
            logger.error("Certificate generation failed", { error: err })
          );
        }

        return {
          success: true,
          newStatus,
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
        summary: "Toggle item completion status",
      },
    }
  )
  .get(
    "/courses/:courseSlug/related",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [[course], userEnrollments] = await Promise.all([
          db
            .select({
              id: coursesTable.id,
              categoryId: coursesTable.categoryId,
            })
            .from(coursesTable)
            .where(
              and(
                eq(coursesTable.slug, ctx.params.courseSlug),
                eq(coursesTable.tenantId, ctx.user.tenantId)
              )
            )
            .limit(1),
          db
            .select({ courseId: enrollmentsTable.courseId })
            .from(enrollmentsTable)
            .where(eq(enrollmentsTable.userId, ctx.user.id)),
        ]);

        if (!course) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        if (!course.categoryId) {
          return { courses: [] };
        }

        const enrolledCourseIds = userEnrollments.map((e) => e.courseId);

        const conditions = [
          eq(coursesTable.tenantId, ctx.user.tenantId),
          eq(coursesTable.categoryId, course.categoryId),
          eq(coursesTable.status, "published"),
          ne(coursesTable.id, course.id),
        ];

        if (enrolledCourseIds.length > 0) {
          conditions.push(notInArray(coursesTable.id, enrolledCourseIds));
        }

        const relatedCourses = await db
          .select({
            id: coursesTable.id,
            slug: coursesTable.slug,
            title: coursesTable.title,
            thumbnail: coursesTable.thumbnail,
            shortDescription: coursesTable.shortDescription,
            price: coursesTable.price,
            currency: coursesTable.currency,
            instructorName: instructorsTable.name,
            instructorAvatar: instructorsTable.avatar,
          })
          .from(coursesTable)
          .leftJoin(instructorsTable, eq(coursesTable.instructorId, instructorsTable.id))
          .where(and(...conditions))
          .limit(4);

        return {
          courses: relatedCourses.map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            thumbnail: c.thumbnail ? getPresignedUrl(c.thumbnail) : null,
            shortDescription: c.shortDescription,
            price: c.price,
            currency: c.currency,
            instructor: c.instructorName
              ? {
                  name: c.instructorName,
                  avatar: c.instructorAvatar ? getPresignedUrl(c.instructorAvatar) : null,
                }
              : null,
          })),
        };
      }),
    {
      params: t.Object({
        courseSlug: t.String(),
      }),
      detail: {
        tags: ["Learn"],
        summary: "Get related courses by category",
      },
    }
  );
