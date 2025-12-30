import { Elysia, t } from "elysia";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { getPresignedUrl } from "@/lib/upload";
import {
  coursesTable,
  courseModulesTable,
  courseCategoriesTable,
  modulesTable,
  moduleItemsTable,
  categoriesTable,
  instructorProfilesTable,
  usersTable,
  tenantsTable,
  videosTable,
  documentsTable,
  quizzesTable,
  quizQuestionsTable,
  quizOptionsTable,
} from "@/db/schema";
import { eq, and, ilike, count, inArray, sql } from "drizzle-orm";

function requireTenant(
  tenant: typeof tenantsTable.$inferSelect | null
): asserts tenant is typeof tenantsTable.$inferSelect {
  if (!tenant) {
    throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
  }
}

export const campusRoutes = new Elysia({ name: "campus" })
  .get(
    "/resolve",
    async (ctx) => {
        const { hostname } = ctx.query;
        if (!hostname) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Hostname is required", 400);
        }

        const [tenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.customDomain, hostname.toLowerCase()))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            logo: tenant.logo ? getPresignedUrl(tenant.logo) : null,
            favicon: tenant.favicon ? getPresignedUrl(tenant.favicon) : null,
            theme: tenant.theme,
            mode: tenant.mode,
            seoTitle: tenant.seoTitle,
            seoDescription: tenant.seoDescription,
            seoKeywords: tenant.seoKeywords,
            heroTitle: tenant.heroTitle,
            heroSubtitle: tenant.heroSubtitle,
            heroCta: tenant.heroCta,
            footerText: tenant.footerText,
            heroPattern: tenant.heroPattern,
            coursesPagePattern: tenant.coursesPagePattern,
            showHeaderName: tenant.showHeaderName,
            socialLinks: tenant.socialLinks,
            contactEmail: tenant.contactEmail,
            customTheme: tenant.customTheme,
            aiAssistantSettings: tenant.aiAssistantSettings,
            authSettings: tenant.authSettings
              ? {
                  provider: tenant.authSettings.provider,
                  firebaseProjectId: tenant.authSettings.firebase?.projectId,
                  firebaseApiKey: tenant.authSettings.firebase?.apiKey,
                  firebaseAuthDomain: tenant.authSettings.firebase?.authDomain,
                }
              : null,
          },
        };
      },
    {
      query: t.Object({
        hostname: t.String(),
      }),
      detail: {
        tags: ["Campus"],
        summary: "Resolve tenant by custom domain hostname",
      },
    }
  )
  .use(tenantPlugin)
  .get("/tenant", async (ctx) => {
      requireTenant(ctx.tenant);
      return {
        tenant: {
          id: ctx.tenant.id,
          name: ctx.tenant.name,
          slug: ctx.tenant.slug,
          logo: ctx.tenant.logo ? getPresignedUrl(ctx.tenant.logo) : null,
          favicon: ctx.tenant.favicon ? getPresignedUrl(ctx.tenant.favicon) : null,
          theme: ctx.tenant.theme,
          mode: ctx.tenant.mode,
          seoTitle: ctx.tenant.seoTitle,
          seoDescription: ctx.tenant.seoDescription,
          seoKeywords: ctx.tenant.seoKeywords,
          heroTitle: ctx.tenant.heroTitle,
          heroSubtitle: ctx.tenant.heroSubtitle,
          heroCta: ctx.tenant.heroCta,
          footerText: ctx.tenant.footerText,
          heroPattern: ctx.tenant.heroPattern,
          coursesPagePattern: ctx.tenant.coursesPagePattern,
          showHeaderName: ctx.tenant.showHeaderName,
          socialLinks: ctx.tenant.socialLinks,
          contactEmail: ctx.tenant.contactEmail,
          customTheme: ctx.tenant.customTheme,
          aiAssistantSettings: ctx.tenant.aiAssistantSettings,
          authSettings: ctx.tenant.authSettings
            ? {
                provider: ctx.tenant.authSettings.provider,
                firebaseProjectId: ctx.tenant.authSettings.firebase?.projectId,
                firebaseApiKey: ctx.tenant.authSettings.firebase?.apiKey,
                firebaseAuthDomain: ctx.tenant.authSettings.firebase?.authDomain,
              }
            : null,
        },
      };
    },
    {
      detail: { tags: ["Campus"], summary: "Get current tenant" },
    }
  )
  .get(
    "/courses",
    async (ctx) => {
        requireTenant(ctx.tenant);
        const { category, level, search, page = "1", limit = "12" } = ctx.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = and(
          eq(coursesTable.tenantId, ctx.tenant.id),
          eq(coursesTable.status, "published")
        );

        if (category) {
          const categorySlugs = category.split(",").filter(Boolean);
          if (categorySlugs.length > 0) {
            const categoryRecords = await db
              .select({ id: categoriesTable.id })
              .from(categoriesTable)
              .where(
                and(
                  eq(categoriesTable.tenantId, ctx.tenant.id),
                  inArray(categoriesTable.slug, categorySlugs)
                )
              );

            if (categoryRecords.length > 0) {
              const categoryIds = categoryRecords.map((c) => c.id);
              const courseIdsInCategories = db
                .select({ courseId: courseCategoriesTable.courseId })
                .from(courseCategoriesTable)
                .where(inArray(courseCategoriesTable.categoryId, categoryIds));
              whereClause = and(
                whereClause,
                inArray(coursesTable.id, courseIdsInCategories)
              );
            }
          }
        }

        if (level) {
          whereClause = and(
            whereClause,
            eq(coursesTable.level, level as "beginner" | "intermediate" | "advanced")
          );
        }

        if (search) {
          whereClause = and(
            whereClause,
            ilike(coursesTable.title, `%${search}%`)
          );
        }

        const coursesQuery = db
          .select({
            course: coursesTable,
            instructorProfile: instructorProfilesTable,
            instructorUser: {
              name: usersTable.name,
              avatar: usersTable.avatar,
            },
          })
          .from(coursesTable)
          .leftJoin(
            instructorProfilesTable,
            eq(coursesTable.instructorId, instructorProfilesTable.id)
          )
          .leftJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
          .where(whereClause)
          .orderBy(coursesTable.order)
          .limit(limitNum)
          .offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(coursesTable)
          .where(whereClause);

        const [coursesData, [{ count: total }]] = await Promise.all([
          coursesQuery,
          countQuery,
        ]);

        const courseIds = coursesData.map((c) => c.course.id);

        const [modulesCounts, categoriesData] = await Promise.all([
          courseIds.length > 0
            ? db
                .select({
                  courseId: courseModulesTable.courseId,
                  count: count(),
                })
                .from(courseModulesTable)
                .where(inArray(courseModulesTable.courseId, courseIds))
                .groupBy(courseModulesTable.courseId)
            : [],
          courseIds.length > 0
            ? db
                .select({
                  courseId: courseCategoriesTable.courseId,
                  slug: categoriesTable.slug,
                  name: categoriesTable.name,
                })
                .from(courseCategoriesTable)
                .innerJoin(
                  categoriesTable,
                  eq(courseCategoriesTable.categoryId, categoriesTable.id)
                )
                .where(inArray(courseCategoriesTable.courseId, courseIds))
            : [],
        ]);

        const modulesCountMap = new Map(
          modulesCounts.map((mc) => [mc.courseId, mc.count])
        );

        const categoriesByCourse = new Map<
          string,
          Array<{ slug: string; name: string }>
        >();
        for (const cat of categoriesData) {
          const existing = categoriesByCourse.get(cat.courseId) ?? [];
          existing.push({ slug: cat.slug, name: cat.name });
          categoriesByCourse.set(cat.courseId, existing);
        }

        const courses = coursesData.map(
          ({ course, instructorProfile, instructorUser }) => ({
            id: course.id,
            slug: course.slug,
            title: course.title,
            shortDescription: course.shortDescription || "",
            description: course.description || "",
            thumbnail: course.thumbnail
              ? getPresignedUrl(course.thumbnail)
              : null,
            previewVideoUrl: course.previewVideoUrl
              ? getPresignedUrl(course.previewVideoUrl)
              : null,
            price: course.price,
            originalPrice: course.originalPrice,
            currency: course.currency,
            level: course.level,
            language: course.language || "es",
            tags: course.tags || [],
            features: course.features || [],
            requirements: course.requirements || [],
            objectives: course.objectives || [],
            modulesCount: modulesCountMap.get(course.id) ?? 0,
            studentsCount: 0,
            rating: 0,
            reviewsCount: 0,
            categories: categoriesByCourse.get(course.id) ?? [],
            instructor: instructorProfile
              ? {
                  name: instructorUser?.name ?? null,
                  avatar: instructorUser?.avatar
                    ? getPresignedUrl(instructorUser.avatar)
                    : null,
                  title: instructorProfile.title,
                  bio: instructorProfile.bio,
                }
              : null,
          })
        );

        return {
          courses,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        level: t.Optional(t.String()),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ["Campus"], summary: "List published courses" },
    }
  )
  .get(
    "/courses/:slug",
    async (ctx) => {
      requireTenant(ctx.tenant);
      const [result] = await db
        .select({
          course: coursesTable,
          instructorProfile: instructorProfilesTable,
          instructorUser: {
            name: usersTable.name,
            avatar: usersTable.avatar,
          },
        })
        .from(coursesTable)
        .leftJoin(
          instructorProfilesTable,
          eq(coursesTable.instructorId, instructorProfilesTable.id)
        )
        .leftJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(
          and(
            eq(coursesTable.tenantId, ctx.tenant.id),
            eq(coursesTable.slug, ctx.params.slug),
            eq(coursesTable.status, "published")
          )
        )
        .limit(1);

      if (!result) {
        throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
      }

      const { course, instructorProfile, instructorUser } = result;

      const courseCategories = await db
        .select({
          slug: categoriesTable.slug,
          name: categoriesTable.name,
        })
        .from(courseCategoriesTable)
        .innerJoin(
          categoriesTable,
          eq(courseCategoriesTable.categoryId, categoriesTable.id)
        )
        .where(eq(courseCategoriesTable.courseId, course.id));

      const courseModules = await db
        .select({
          id: courseModulesTable.id,
          moduleId: courseModulesTable.moduleId,
          order: courseModulesTable.order,
          module: modulesTable,
          itemsCount: sql<number>`cast(count(${moduleItemsTable.id}) as int)`,
        })
        .from(courseModulesTable)
        .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
        .leftJoin(moduleItemsTable, eq(modulesTable.id, moduleItemsTable.moduleId))
        .where(eq(courseModulesTable.courseId, course.id))
        .groupBy(courseModulesTable.id, modulesTable.id)
        .orderBy(courseModulesTable.order);

      const modules = courseModules.map((cm) => ({
        id: cm.module.id,
        title: cm.module.title,
        description: cm.module.description,
        itemsCount: cm.itemsCount,
        order: cm.order,
      }));

      const totalItems = modules.reduce((acc, m) => acc + m.itemsCount, 0);

      return {
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          shortDescription: course.shortDescription || "",
          description: course.description || "",
          thumbnail: course.thumbnail ? getPresignedUrl(course.thumbnail) : null,
          previewVideoUrl: course.previewVideoUrl ? getPresignedUrl(course.previewVideoUrl) : null,
          price: course.price,
          originalPrice: course.originalPrice,
          currency: course.currency,
          level: course.level,
          language: course.language || "es",
          tags: course.tags || [],
          features: course.features || [],
          requirements: course.requirements || [],
          objectives: course.objectives || [],
          modulesCount: modules.length,
          itemsCount: totalItems,
          studentsCount: 0,
          rating: 0,
          reviewsCount: 0,
          includeCertificate: course.includeCertificate,
          categories: courseCategories,
          instructor: instructorProfile
            ? {
                name: instructorUser?.name ?? null,
                avatar: instructorUser?.avatar
                  ? getPresignedUrl(instructorUser.avatar)
                  : null,
                title: instructorProfile.title,
                bio: instructorProfile.bio,
              }
            : null,
          modules,
        },
      };
    },
    {
      detail: { tags: ["Campus"], summary: "Get course by slug" },
    }
  )
  .get(
    "/categories",
    async (ctx) => {
      requireTenant(ctx.tenant);
      const categories = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.tenantId, ctx.tenant.id))
        .orderBy(categoriesTable.order);

      return {
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
        })),
      };
    },
    {
      detail: { tags: ["Campus"], summary: "List categories" },
    }
  )
  .get(
    "/stats",
    async (ctx) => {
      requireTenant(ctx.tenant);
      const [coursesCount, studentsCount, categoriesCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.tenantId, ctx.tenant.id),
              eq(coursesTable.status, "published")
            )
          ),
        db
          .select({ count: count() })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.tenantId, ctx.tenant.id),
              eq(usersTable.role, "student")
            )
          ),
        db
          .select({ count: count() })
          .from(categoriesTable)
          .where(eq(categoriesTable.tenantId, ctx.tenant.id)),
      ]);

      return {
        stats: {
          totalCourses: coursesCount[0].count,
          totalStudents: studentsCount[0].count,
          categories: categoriesCount[0].count,
        },
      };
    },
    {
      detail: { tags: ["Campus"], summary: "Get tenant stats" },
    }
  )
  .get(
    "/modules/:moduleId/items",
    async (ctx) => {
        requireTenant(ctx.tenant);
        const moduleItems = await db
          .select({
            id: moduleItemsTable.id,
            moduleId: moduleItemsTable.moduleId,
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
            order: moduleItemsTable.order,
            isPreview: moduleItemsTable.isPreview,
          })
          .from(moduleItemsTable)
          .innerJoin(modulesTable, eq(moduleItemsTable.moduleId, modulesTable.id))
          .where(
            and(
              eq(moduleItemsTable.moduleId, ctx.params.moduleId),
              eq(modulesTable.tenantId, ctx.tenant.id)
            )
          )
          .orderBy(moduleItemsTable.order);

        if (moduleItems.length === 0) {
          return { items: [] };
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
                .select({ id: videosTable.id, title: videosTable.title, duration: videosTable.duration })
                .from(videosTable)
                .where(inArray(videosTable.id, videoIds))
            : [],
          documentIds.length > 0
            ? db
                .select({ id: documentsTable.id, title: documentsTable.title, mimeType: documentsTable.mimeType })
                .from(documentsTable)
                .where(inArray(documentsTable.id, documentIds))
            : [],
          quizIds.length > 0
            ? db
                .select({ id: quizzesTable.id, title: quizzesTable.title })
                .from(quizzesTable)
                .where(inArray(quizzesTable.id, quizIds))
            : [],
        ]);

        const contentMap = new Map<string, { title: string; duration?: number; mimeType?: string | null }>();
        for (const v of videos) contentMap.set(v.id, { title: v.title, duration: v.duration });
        for (const d of documents) contentMap.set(d.id, { title: d.title, mimeType: d.mimeType });
        for (const q of quizzes) contentMap.set(q.id, { title: q.title });

        const items = moduleItems
          .map((item) => {
            const content = contentMap.get(item.contentId);
            if (!content) return null;
            return {
              id: item.id,
              title: content.title,
              contentType: item.contentType,
              isPreview: item.isPreview,
              order: item.order,
              duration: content.duration,
              mimeType: content.mimeType,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        return { items };
      },
    {
      detail: { tags: ["Campus"], summary: "Get module items" },
    }
  )
  .get(
    "/preview/:moduleItemId/content",
    async (ctx) => {
        requireTenant(ctx.tenant);
        const [item] = await db
          .select({
            id: moduleItemsTable.id,
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
            isPreview: moduleItemsTable.isPreview,
          })
          .from(moduleItemsTable)
          .innerJoin(modulesTable, eq(moduleItemsTable.moduleId, modulesTable.id))
          .where(
            and(
              eq(moduleItemsTable.id, ctx.params.moduleItemId),
              eq(modulesTable.tenantId, ctx.tenant.id)
            )
          )
          .limit(1);

        if (!item) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not found", 404);
        }

        if (!item.isPreview) {
          throw new AppError(ErrorCode.FORBIDDEN, "Content not available for preview", 403);
        }

        if (item.contentType === "video") {
          const [video] = await db
            .select({
              id: videosTable.id,
              title: videosTable.title,
              description: videosTable.description,
              videoKey: videosTable.videoKey,
              duration: videosTable.duration,
            })
            .from(videosTable)
            .where(eq(videosTable.id, item.contentId))
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
          const [quiz] = await db
            .select({
              id: quizzesTable.id,
              title: quizzesTable.title,
              description: quizzesTable.description,
            })
            .from(quizzesTable)
            .where(eq(quizzesTable.id, item.contentId))
            .limit(1);

          if (!quiz) {
            throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
          }

          const questions = await db
            .select({
              id: quizQuestionsTable.id,
              type: quizQuestionsTable.type,
              questionText: quizQuestionsTable.questionText,
              order: quizQuestionsTable.order,
            })
            .from(quizQuestionsTable)
            .where(eq(quizQuestionsTable.quizId, quiz.id))
            .orderBy(quizQuestionsTable.order);

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
                  .orderBy(quizOptionsTable.order)
              : [];

          const optionsByQuestion = new Map<
            string,
            Array<{ id: string; optionText: string; order: number }>
          >();
          for (const opt of options) {
            const existing = optionsByQuestion.get(opt.questionId) ?? [];
            existing.push({ id: opt.id, optionText: opt.optionText, order: opt.order });
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
              order: q.order,
              options: optionsByQuestion.get(q.id) ?? [],
            })),
          };
        }

        throw new AppError(ErrorCode.BAD_REQUEST, "Invalid content type", 400);
      },
    {
      detail: { tags: ["Campus"], summary: "Get preview content for a module item" },
    }
  );
