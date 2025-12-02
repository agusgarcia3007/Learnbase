import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  coursesTable,
  courseModulesTable,
  modulesTable,
  moduleLessonsTable,
  lessonsTable,
  instructorsTable,
  categoriesTable,
  courseLevelEnum,
  courseStatusEnum,
  type SelectCourse,
} from "@/db/schema";
import { count, eq, and, desc, sql } from "drizzle-orm";
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

const courseFieldMap: FieldMap<typeof coursesTable> = {
  id: coursesTable.id,
  title: coursesTable.title,
  status: coursesTable.status,
  level: coursesTable.level,
  order: coursesTable.order,
  createdAt: coursesTable.createdAt,
  updatedAt: coursesTable.updatedAt,
};

const courseSearchableFields: SearchableFields<typeof coursesTable> = [
  coursesTable.title,
];

const courseDateFields: DateFields = new Set(["createdAt"]);

export const coursesRoutes = new Elysia()
  .use(authPlugin)
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

        const canManageCourses =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageCourses) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage courses",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          courseFieldMap,
          courseSearchableFields,
          courseDateFields
        );

        const tenantFilter = eq(coursesTable.tenantId, ctx.user.tenantId);

        let whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        if (ctx.query.categoryId) {
          whereClause = and(
            whereClause,
            eq(coursesTable.categoryId, ctx.query.categoryId)
          );
        }

        const sortColumn = getSortColumn(params.sort, courseFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const coursesQuery = db
          .select({
            course: coursesTable,
            instructor: instructorsTable,
            category: categoriesTable,
          })
          .from(coursesTable)
          .leftJoin(
            instructorsTable,
            eq(coursesTable.instructorId, instructorsTable.id)
          )
          .leftJoin(
            categoriesTable,
            eq(coursesTable.categoryId, categoriesTable.id)
          )
          .where(whereClause)
          .orderBy(sortColumn ?? desc(coursesTable.createdAt))
          .limit(limit)
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
          ...course,
          instructor,
          category,
          modulesCount: modulesCountMap.get(course.id) ?? 0,
        }));

        return {
          courses,
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
        level: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Courses"],
        summary: "List courses with pagination and filters",
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

        const [result] = await db
          .select({
            course: coursesTable,
            instructor: instructorsTable,
            category: categoriesTable,
          })
          .from(coursesTable)
          .leftJoin(
            instructorsTable,
            eq(coursesTable.instructorId, instructorsTable.id)
          )
          .leftJoin(
            categoriesTable,
            eq(coursesTable.categoryId, categoriesTable.id)
          )
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!result) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const courseModules = await db
          .select({
            id: courseModulesTable.id,
            moduleId: courseModulesTable.moduleId,
            order: courseModulesTable.order,
            module: modulesTable,
          })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(eq(courseModulesTable.courseId, ctx.params.id))
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

        const modulesWithLessonsCount = courseModules.map((cm) => ({
          ...cm,
          module: {
            ...cm.module,
            lessonsCount: lessonsCountMap.get(cm.moduleId) ?? 0,
          },
        }));

        return {
          course: {
            ...result.course,
            instructor: result.instructor,
            category: result.category,
            modules: modulesWithLessonsCount,
            modulesCount: courseModules.length,
          },
        };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Get course by ID with modules",
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

        const canManageCourses =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageCourses) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create courses",
            403
          );
        }

        const [maxOrder] = await db
          .select({ maxOrder: coursesTable.order })
          .from(coursesTable)
          .where(eq(coursesTable.tenantId, ctx.user.tenantId))
          .orderBy(desc(coursesTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const slug =
          ctx.body.slug ||
          ctx.body.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const [course] = await db
          .insert(coursesTable)
          .values({
            tenantId: ctx.user.tenantId,
            instructorId: ctx.body.instructorId,
            categoryId: ctx.body.categoryId,
            slug,
            title: ctx.body.title,
            description: ctx.body.description,
            shortDescription: ctx.body.shortDescription,
            thumbnail: ctx.body.thumbnail,
            previewVideoUrl: ctx.body.previewVideoUrl,
            price: ctx.body.price ?? 0,
            originalPrice: ctx.body.originalPrice,
            currency: ctx.body.currency ?? "USD",
            level: ctx.body.level ?? "beginner",
            tags: ctx.body.tags,
            language: ctx.body.language ?? "es",
            status: ctx.body.status ?? "draft",
            order: nextOrder,
            features: ctx.body.features,
            requirements: ctx.body.requirements,
            objectives: ctx.body.objectives,
          })
          .returning();

        return { course: { ...course, modulesCount: 0, modules: [] } };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        shortDescription: t.Optional(t.String()),
        thumbnail: t.Optional(t.String()),
        previewVideoUrl: t.Optional(t.String()),
        instructorId: t.Optional(t.String({ format: "uuid" })),
        categoryId: t.Optional(t.String({ format: "uuid" })),
        price: t.Optional(t.Number({ minimum: 0 })),
        originalPrice: t.Optional(t.Number({ minimum: 0 })),
        currency: t.Optional(t.String()),
        level: t.Optional(
          t.Enum(
            Object.fromEntries(courseLevelEnum.enumValues.map((v) => [v, v]))
          )
        ),
        tags: t.Optional(t.Array(t.String())),
        language: t.Optional(t.String()),
        status: t.Optional(
          t.Enum(
            Object.fromEntries(courseStatusEnum.enumValues.map((v) => [v, v]))
          )
        ),
        features: t.Optional(t.Array(t.String())),
        requirements: t.Optional(t.Array(t.String())),
        objectives: t.Optional(t.Array(t.String())),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Create a new course",
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

        const canManageCourses =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageCourses) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update courses",
            403
          );
        }

        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const updateData: Partial<SelectCourse> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.slug !== undefined) updateData.slug = ctx.body.slug;
        if (ctx.body.description !== undefined)
          updateData.description = ctx.body.description;
        if (ctx.body.shortDescription !== undefined)
          updateData.shortDescription = ctx.body.shortDescription;
        if (ctx.body.thumbnail !== undefined)
          updateData.thumbnail = ctx.body.thumbnail;
        if (ctx.body.previewVideoUrl !== undefined)
          updateData.previewVideoUrl = ctx.body.previewVideoUrl;
        if (ctx.body.instructorId !== undefined)
          updateData.instructorId = ctx.body.instructorId;
        if (ctx.body.categoryId !== undefined)
          updateData.categoryId = ctx.body.categoryId;
        if (ctx.body.price !== undefined) updateData.price = ctx.body.price;
        if (ctx.body.originalPrice !== undefined)
          updateData.originalPrice = ctx.body.originalPrice;
        if (ctx.body.currency !== undefined)
          updateData.currency = ctx.body.currency;
        if (ctx.body.level !== undefined) updateData.level = ctx.body.level;
        if (ctx.body.tags !== undefined) updateData.tags = ctx.body.tags;
        if (ctx.body.language !== undefined)
          updateData.language = ctx.body.language;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;
        if (ctx.body.features !== undefined)
          updateData.features = ctx.body.features;
        if (ctx.body.requirements !== undefined)
          updateData.requirements = ctx.body.requirements;
        if (ctx.body.objectives !== undefined)
          updateData.objectives = ctx.body.objectives;

        const [updatedCourse] = await db
          .update(coursesTable)
          .set(updateData)
          .where(eq(coursesTable.id, ctx.params.id))
          .returning();

        const [modulesCount] = await db
          .select({ count: count() })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.courseId, ctx.params.id));

        return {
          course: { ...updatedCourse, modulesCount: modulesCount.count },
        };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        slug: t.Optional(t.String()),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        shortDescription: t.Optional(t.Union([t.String(), t.Null()])),
        thumbnail: t.Optional(t.Union([t.String(), t.Null()])),
        previewVideoUrl: t.Optional(t.Union([t.String(), t.Null()])),
        instructorId: t.Optional(
          t.Union([t.String({ format: "uuid" }), t.Null()])
        ),
        categoryId: t.Optional(
          t.Union([t.String({ format: "uuid" }), t.Null()])
        ),
        price: t.Optional(t.Number({ minimum: 0 })),
        originalPrice: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
        currency: t.Optional(t.String()),
        level: t.Optional(
          t.Enum(
            Object.fromEntries(courseLevelEnum.enumValues.map((v) => [v, v]))
          )
        ),
        tags: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
        language: t.Optional(t.String()),
        status: t.Optional(
          t.Enum(
            Object.fromEntries(courseStatusEnum.enumValues.map((v) => [v, v]))
          )
        ),
        order: t.Optional(t.Number({ minimum: 0 })),
        features: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
        requirements: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
        objectives: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Update a course",
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

        const canManageCourses =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageCourses) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete courses",
            403
          );
        }

        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        await db.delete(coursesTable).where(eq(coursesTable.id, ctx.params.id));

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Delete a course",
      },
    }
  )
  .put(
    "/:id/modules",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageCourses =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManageCourses) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update course modules",
            403
          );
        }

        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        await db.transaction(async (tx) => {
          await tx
            .delete(courseModulesTable)
            .where(eq(courseModulesTable.courseId, ctx.params.id));

          if (ctx.body.modules.length > 0) {
            await tx.insert(courseModulesTable).values(
              ctx.body.modules.map((module, index) => ({
                courseId: ctx.params.id,
                moduleId: module.moduleId,
                order: module.order ?? index,
              }))
            );
          }
        });

        const courseModules = await db
          .select({
            id: courseModulesTable.id,
            moduleId: courseModulesTable.moduleId,
            order: courseModulesTable.order,
            module: modulesTable,
          })
          .from(courseModulesTable)
          .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
          .where(eq(courseModulesTable.courseId, ctx.params.id))
          .orderBy(courseModulesTable.order);

        return {
          course: {
            ...existingCourse,
            modules: courseModules,
            modulesCount: courseModules.length,
          },
        };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        modules: t.Array(
          t.Object({
            moduleId: t.String({ format: "uuid" }),
            order: t.Optional(t.Number({ minimum: 0 })),
          })
        ),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Batch update course modules (replaces all)",
      },
    }
  );
