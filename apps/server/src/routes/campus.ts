import { Elysia, t } from "elysia";
import { tenantPlugin } from "@/plugins/tenant";
import { withHandler } from "@/lib/handler";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { getPresignedUrl } from "@/lib/upload";
import {
  coursesTable,
  courseModulesTable,
  modulesTable,
  moduleLessonsTable,
  categoriesTable,
  instructorsTable,
  tenantsTable,
} from "@/db/schema";
import { eq, and, ilike, count, sql } from "drizzle-orm";

export const campusRoutes = new Elysia({ name: "campus" })
  .get(
    "/resolve",
    (ctx) =>
      withHandler(ctx, async () => {
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
          },
        };
      }),
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
  .get("/tenant", (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }
      return {
        tenant: {
          id: ctx.tenant.id,
          name: ctx.tenant.name,
          slug: ctx.tenant.slug,
          logo: ctx.tenant.logo ? getPresignedUrl(ctx.tenant.logo) : null,
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
        },
      };
    })
  )
  .get(
    "/courses",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const { category, level, search, page = "1", limit = "12" } = ctx.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = and(
          eq(coursesTable.tenantId, ctx.tenant.id),
          eq(coursesTable.status, "published")
        );

        if (category) {
          const [categoryRecord] = await db
            .select()
            .from(categoriesTable)
            .where(
              and(
                eq(categoriesTable.tenantId, ctx.tenant.id),
                eq(categoriesTable.slug, category)
              )
            )
            .limit(1);

          if (categoryRecord) {
            whereClause = and(whereClause, eq(coursesTable.categoryId, categoryRecord.id));
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
            instructor: instructorsTable,
            category: categoriesTable,
          })
          .from(coursesTable)
          .leftJoin(instructorsTable, eq(coursesTable.instructorId, instructorsTable.id))
          .leftJoin(categoriesTable, eq(coursesTable.categoryId, categoriesTable.id))
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

        const modulesCounts =
          courseIds.length > 0
            ? await db
                .select({
                  courseId: courseModulesTable.courseId,
                  count: count(),
                })
                .from(courseModulesTable)
                .groupBy(courseModulesTable.courseId)
            : [];

        const modulesCountMap = new Map(
          modulesCounts.map((mc) => [mc.courseId, mc.count])
        );

        const courses = coursesData.map(({ course, instructor, category }) => ({
          id: course.id,
          slug: course.slug,
          title: course.title,
          shortDescription: course.shortDescription || "",
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          previewVideoUrl: course.previewVideoUrl || "",
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
          category: category?.slug || null,
          categoryName: category?.name || null,
          instructor: instructor
            ? {
                name: instructor.name,
                avatar: instructor.avatar,
                title: instructor.title,
                bio: instructor.bio,
              }
            : null,
        }));

        return {
          courses,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      }),
    {
      query: t.Object({
        category: t.Optional(t.String()),
        level: t.Optional(t.String()),
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )
  .get("/courses/:slug", (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }

      const [result] = await db
        .select({
          course: coursesTable,
          instructor: instructorsTable,
          category: categoriesTable,
        })
        .from(coursesTable)
        .leftJoin(instructorsTable, eq(coursesTable.instructorId, instructorsTable.id))
        .leftJoin(categoriesTable, eq(coursesTable.categoryId, categoriesTable.id))
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

      const { course, instructor, category } = result;

      const courseModules = await db
        .select({
          id: courseModulesTable.id,
          moduleId: courseModulesTable.moduleId,
          order: courseModulesTable.order,
          module: modulesTable,
        })
        .from(courseModulesTable)
        .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
        .where(eq(courseModulesTable.courseId, course.id))
        .orderBy(courseModulesTable.order);

      const moduleIds = courseModules.map((cm) => cm.moduleId);

      const lessonsCounts =
        moduleIds.length > 0
          ? await db
              .select({
                moduleId: moduleLessonsTable.moduleId,
                count: count(),
              })
              .from(moduleLessonsTable)
              .groupBy(moduleLessonsTable.moduleId)
          : [];

      const lessonsCountMap = new Map(
        lessonsCounts.map((lc) => [lc.moduleId, lc.count])
      );

      const modules = courseModules.map((cm) => ({
        id: cm.module.id,
        title: cm.module.title,
        description: cm.module.description,
        lessonsCount: lessonsCountMap.get(cm.moduleId) ?? 0,
        order: cm.order,
      }));

      const totalLessons = modules.reduce((acc, m) => acc + m.lessonsCount, 0);

      return {
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          shortDescription: course.shortDescription || "",
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          previewVideoUrl: course.previewVideoUrl || "",
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
          lessonsCount: totalLessons,
          studentsCount: 0,
          rating: 0,
          reviewsCount: 0,
          category: category?.slug || null,
          categoryName: category?.name || null,
          instructor: instructor
            ? {
                name: instructor.name,
                avatar: instructor.avatar,
                title: instructor.title,
                bio: instructor.bio,
              }
            : null,
          modules,
        },
      };
    })
  )
  .get("/categories", (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }

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
    })
  )
  .get("/stats", (ctx) =>
    withHandler(ctx, async () => {
      if (!ctx.tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }

      const [coursesCount] = await db
        .select({ count: count() })
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.tenantId, ctx.tenant.id),
            eq(coursesTable.status, "published")
          )
        );

      const [categoriesCount] = await db
        .select({ count: count() })
        .from(categoriesTable)
        .where(eq(categoriesTable.tenantId, ctx.tenant.id));

      return {
        stats: {
          totalCourses: coursesCount.count,
          totalStudents: 0,
          categories: categoriesCount.count,
        },
      };
    })
  );
