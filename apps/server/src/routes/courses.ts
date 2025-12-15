import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  coursesTable,
  courseModulesTable,
  courseCategoriesTable,
  modulesTable,
  moduleItemsTable,
  instructorsTable,
  categoriesTable,
  courseLevelEnum,
  courseStatusEnum,
  type SelectCourse,
} from "@/db/schema";
import { count, eq, and, desc, inArray } from "drizzle-orm";
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
import { uploadFileToS3, getPresignedUrl, deleteFromS3 } from "@/lib/upload";

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
  .use(guardPlugin)
  .get(
    "/",
    async (ctx) => {
      const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          courseFieldMap,
          courseSearchableFields,
          courseDateFields
        );

        const tenantFilter = eq(coursesTable.tenantId, ctx.user!.tenantId!);

        let whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        if (ctx.query.categoryIds) {
          const categoryIdList = ctx.query.categoryIds.split(",").filter(Boolean);
          if (categoryIdList.length > 0) {
            const courseIdsWithCategories = db
              .select({ courseId: courseCategoriesTable.courseId })
              .from(courseCategoriesTable)
              .where(inArray(courseCategoriesTable.categoryId, categoryIdList));
            whereClause = and(
              whereClause,
              inArray(coursesTable.id, courseIdsWithCategories)
            );
          }
        }

        const sortColumn = getSortColumn(params.sort, courseFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const modulesCountSq = db
          .select({
            courseId: courseModulesTable.courseId,
            modulesCount: count().as("modules_count"),
          })
          .from(courseModulesTable)
          .groupBy(courseModulesTable.courseId)
          .as("modules_count_sq");

        const coursesQuery = db
          .select({
            course: coursesTable,
            instructor: {
              id: instructorsTable.id,
              name: instructorsTable.name,
              avatar: instructorsTable.avatar,
            },
            modulesCount: modulesCountSq.modulesCount,
          })
          .from(coursesTable)
          .leftJoin(
            instructorsTable,
            eq(coursesTable.instructorId, instructorsTable.id)
          )
          .leftJoin(modulesCountSq, eq(coursesTable.id, modulesCountSq.courseId))
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
        const categoriesData =
          courseIds.length > 0
            ? await db
                .select({
                  courseId: courseCategoriesTable.courseId,
                  categoryId: categoriesTable.id,
                  categoryName: categoriesTable.name,
                })
                .from(courseCategoriesTable)
                .innerJoin(
                  categoriesTable,
                  eq(courseCategoriesTable.categoryId, categoriesTable.id)
                )
                .where(inArray(courseCategoriesTable.courseId, courseIds))
            : [];

        const categoriesByCourse = new Map<
          string,
          Array<{ id: string; name: string }>
        >();
        for (const cat of categoriesData) {
          const existing = categoriesByCourse.get(cat.courseId) ?? [];
          existing.push({ id: cat.categoryId, name: cat.categoryName });
          categoriesByCourse.set(cat.courseId, existing);
        }

        const courses = coursesData.map(({ course, instructor, modulesCount }) => ({
          ...course,
          thumbnail: course.thumbnail ? getPresignedUrl(course.thumbnail) : null,
          previewVideoUrl: course.previewVideoUrl ? getPresignedUrl(course.previewVideoUrl) : null,
          instructor: instructor?.id ? instructor : null,
          categories: categoriesByCourse.get(course.id) ?? [],
          modulesCount: modulesCount ?? 0,
        }));

      return {
        courses,
        pagination: calculatePagination(total, params.page, params.limit),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        level: t.Optional(t.String()),
        categoryIds: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Courses"],
        summary: "List courses with pagination and filters",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .get(
    "/:id",
    async (ctx) => {
      const [result] = await db
          .select({
            course: coursesTable,
            instructor: instructorsTable,
          })
          .from(coursesTable)
          .leftJoin(
            instructorsTable,
            eq(coursesTable.instructorId, instructorsTable.id)
          )
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
            )
          )
          .limit(1);

        if (!result) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [courseCategories, courseModules] = await Promise.all([
          db
            .select({
              id: categoriesTable.id,
              name: categoriesTable.name,
            })
            .from(courseCategoriesTable)
            .innerJoin(
              categoriesTable,
              eq(courseCategoriesTable.categoryId, categoriesTable.id)
            )
            .where(eq(courseCategoriesTable.courseId, ctx.params.id)),
          db
            .select({
              id: courseModulesTable.id,
              moduleId: courseModulesTable.moduleId,
              order: courseModulesTable.order,
              module: modulesTable,
            })
            .from(courseModulesTable)
            .innerJoin(modulesTable, eq(courseModulesTable.moduleId, modulesTable.id))
            .where(eq(courseModulesTable.courseId, ctx.params.id))
            .orderBy(courseModulesTable.order),
        ]);

        const moduleIds = courseModules.map((cm) => cm.moduleId);

        const itemsCounts =
          moduleIds.length > 0
            ? await db
                .select({
                  moduleId: moduleItemsTable.moduleId,
                  count: count(),
                })
                .from(moduleItemsTable)
                .where(inArray(moduleItemsTable.moduleId, moduleIds))
                .groupBy(moduleItemsTable.moduleId)
            : [];

        const itemsCountMap = new Map(
          itemsCounts.map((ic) => [ic.moduleId, ic.count])
        );

        const modulesWithItemsCount = courseModules.map((cm) => ({
          ...cm,
          module: {
            ...cm.module,
            itemsCount: itemsCountMap.get(cm.moduleId) ?? 0,
          },
        }));

      return {
        course: {
          ...result.course,
          thumbnail: result.course.thumbnail ? getPresignedUrl(result.course.thumbnail) : null,
          previewVideoUrl: result.course.previewVideoUrl ? getPresignedUrl(result.course.previewVideoUrl) : null,
          instructor: result.instructor?.id ? result.instructor : null,
          categories: courseCategories,
          modules: modulesWithItemsCount,
          modulesCount: courseModules.length,
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Get course by ID with modules and categories",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .post(
    "/",
    async (ctx) => {
      const [maxOrder] = await db
          .select({ maxOrder: coursesTable.order })
          .from(coursesTable)
          .where(eq(coursesTable.tenantId, ctx.user!.tenantId!))
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
            tenantId: ctx.user!.tenantId!,
            instructorId: ctx.body.instructorId,
            slug,
            title: ctx.body.title,
            description: ctx.body.description,
            shortDescription: ctx.body.shortDescription,
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
            includeCertificate: ctx.body.includeCertificate ?? false,
          })
          .returning();

        let categories: Array<{ id: string; name: string }> = [];
        if (ctx.body.categoryIds && ctx.body.categoryIds.length > 0) {
          await db.insert(courseCategoriesTable).values(
            ctx.body.categoryIds.map((categoryId) => ({
              courseId: course.id,
              categoryId,
            }))
          );
          categories = await db
            .select({ id: categoriesTable.id, name: categoriesTable.name })
            .from(categoriesTable)
            .where(inArray(categoriesTable.id, ctx.body.categoryIds));
        }

      return { course: { ...course, categories, modulesCount: 0, modules: [] } };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        slug: t.Optional(t.String()),
        description: t.Optional(t.String()),
        shortDescription: t.Optional(t.String()),
        instructorId: t.Optional(t.String({ format: "uuid" })),
        categoryIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
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
        includeCertificate: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Create a new course",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .put(
    "/:id",
    async (ctx) => {
        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
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
        if (ctx.body.instructorId !== undefined)
          updateData.instructorId = ctx.body.instructorId;
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
        if (ctx.body.includeCertificate !== undefined)
          updateData.includeCertificate = ctx.body.includeCertificate;

        const [updatedCourse] = await db
          .update(coursesTable)
          .set(updateData)
          .where(eq(coursesTable.id, ctx.params.id))
          .returning();

        if (ctx.body.categoryIds !== undefined) {
          await db
            .delete(courseCategoriesTable)
            .where(eq(courseCategoriesTable.courseId, ctx.params.id));
          if (ctx.body.categoryIds.length > 0) {
            await db.insert(courseCategoriesTable).values(
              ctx.body.categoryIds.map((categoryId) => ({
                courseId: ctx.params.id,
                categoryId,
              }))
            );
          }
        }

        const [categoriesData, [modulesCount]] = await Promise.all([
          db
            .select({ id: categoriesTable.id, name: categoriesTable.name })
            .from(courseCategoriesTable)
            .innerJoin(
              categoriesTable,
              eq(courseCategoriesTable.categoryId, categoriesTable.id)
            )
            .where(eq(courseCategoriesTable.courseId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(courseModulesTable)
            .where(eq(courseModulesTable.courseId, ctx.params.id)),
        ]);

        return {
          course: {
            ...updatedCourse,
            categories: categoriesData,
            modulesCount: modulesCount.count,
          },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        slug: t.Optional(t.String()),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        shortDescription: t.Optional(t.Union([t.String(), t.Null()])),
        instructorId: t.Optional(
          t.Union([t.String({ format: "uuid" }), t.Null()])
        ),
        categoryIds: t.Optional(t.Array(t.String({ format: "uuid" }))),
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
        includeCertificate: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Update a course",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        await db.delete(coursesTable).where(eq(coursesTable.id, ctx.params.id));

        return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Delete a course",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .put(
    "/:id/modules",
    async (ctx) => {
        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
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
    },
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
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .post(
    "/:id/thumbnail",
    async (ctx) => {
      const [existingCourse] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, ctx.params.id),
            eq(coursesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!existingCourse) {
        throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
      }

      const [, thumbnailKey] = await Promise.all([
        existingCourse.thumbnail
          ? deleteFromS3(existingCourse.thumbnail)
          : Promise.resolve(),
        uploadFileToS3({
          file: ctx.body.thumbnail,
          folder: "courses",
          userId: ctx.user!.tenantId!,
        }),
      ]);

      const [updatedCourse] = await db
        .update(coursesTable)
        .set({ thumbnail: thumbnailKey })
        .where(eq(coursesTable.id, ctx.params.id))
        .returning();

      return {
        thumbnailKey,
        thumbnailUrl: getPresignedUrl(thumbnailKey),
        course: updatedCourse,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        thumbnail: t.File({ type: "image", maxSize: "10m" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Upload course thumbnail",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .delete(
    "/:id/thumbnail",
    async (ctx) => {
        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        if (existingCourse.thumbnail) {
          await deleteFromS3(existingCourse.thumbnail);
        }

        const [updatedCourse] = await db
          .update(coursesTable)
          .set({ thumbnail: null })
          .where(eq(coursesTable.id, ctx.params.id))
          .returning();

        return { course: updatedCourse };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Delete course thumbnail",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .post(
    "/:id/video",
    async (ctx) => {
      const [existingCourse] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, ctx.params.id),
            eq(coursesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!existingCourse) {
        throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
      }

      const [, videoKey] = await Promise.all([
        existingCourse.previewVideoUrl
          ? deleteFromS3(existingCourse.previewVideoUrl)
          : Promise.resolve(),
        uploadFileToS3(
          {
            file: ctx.body.video,
            folder: "courses/videos",
            userId: ctx.user!.tenantId!,
          },
          { partSize: 10 * 1024 * 1024, queueSize: 6 }
        ),
      ]);

      const [updatedCourse] = await db
        .update(coursesTable)
        .set({ previewVideoUrl: videoKey })
        .where(eq(coursesTable.id, ctx.params.id))
        .returning();

      return {
        videoKey,
        videoUrl: getPresignedUrl(videoKey),
        course: updatedCourse,
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        video: t.File({ type: "video", maxSize: "500m" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Upload course preview video",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  )
  .delete(
    "/:id/video",
    async (ctx) => {
        const [existingCourse] = await db
          .select()
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user!.tenantId!)
            )
          )
          .limit(1);

        if (!existingCourse) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        if (existingCourse.previewVideoUrl) {
          await deleteFromS3(existingCourse.previewVideoUrl);
        }

        const [updatedCourse] = await db
          .update(coursesTable)
          .set({ previewVideoUrl: null })
          .where(eq(coursesTable.id, ctx.params.id))
          .returning();

        return { course: updatedCourse };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Courses"],
        summary: "Delete course preview video",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "admin", "superadmin"],
    }
  );
