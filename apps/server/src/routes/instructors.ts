import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  instructorsTable,
  coursesTable,
  type SelectInstructor,
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

const instructorFieldMap: FieldMap<typeof instructorsTable> = {
  id: instructorsTable.id,
  name: instructorsTable.name,
  title: instructorsTable.title,
  order: instructorsTable.order,
  createdAt: instructorsTable.createdAt,
  updatedAt: instructorsTable.updatedAt,
};

const instructorSearchableFields: SearchableFields<typeof instructorsTable> = [
  instructorsTable.name,
  instructorsTable.title,
];

const instructorDateFields: DateFields = new Set(["createdAt"]);

export const instructorsRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageInstructors =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageInstructors) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can manage instructors",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          instructorFieldMap,
          instructorSearchableFields,
          instructorDateFields
        );

        const tenantFilter = eq(instructorsTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, instructorFieldMap, {
          field: "order",
          order: "asc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const instructorsQuery = db
          .select()
          .from(instructorsTable)
          .where(whereClause)
          .orderBy(sortColumn ?? instructorsTable.order)
          .limit(limit)
          .offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(instructorsTable)
          .where(whereClause);

        const [instructors, [{ count: total }]] = await Promise.all([
          instructorsQuery,
          countQuery,
        ]);

        const instructorIds = instructors.map((i) => i.id);

        const coursesCounts =
          instructorIds.length > 0
            ? await db
                .select({
                  instructorId: coursesTable.instructorId,
                  count: count(),
                })
                .from(coursesTable)
                .where(
                  and(
                    eq(coursesTable.tenantId, ctx.user.tenantId),
                    inArray(coursesTable.instructorId, instructorIds)
                  )
                )
                .groupBy(coursesTable.instructorId)
            : [];

        const coursesCountMap = new Map(
          coursesCounts.map((cc) => [cc.instructorId, cc.count])
        );

        const instructorsWithCounts = instructors.map((instructor) => ({
          ...instructor,
          coursesCount: coursesCountMap.get(instructor.id) ?? 0,
        }));

        return {
          instructors: instructorsWithCounts,
          pagination: calculatePagination(total, params.page, params.limit),
        };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "List instructors with pagination and filters",
      },
    }
  )
  .get(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [instructor] = await db
          .select()
          .from(instructorsTable)
          .where(
            and(
              eq(instructorsTable.id, ctx.params.id),
              eq(instructorsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!instructor) {
          throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
        }

        const [coursesCount] = await db
          .select({ count: count() })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.instructorId, instructor.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          );

        return {
          instructor: {
            ...instructor,
            coursesCount: coursesCount.count,
          },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Get instructor by ID",
      },
    }
  )
  .post(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageInstructors =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageInstructors) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can create instructors",
            403
          );
        }

        const [maxOrder] = await db
          .select({ maxOrder: instructorsTable.order })
          .from(instructorsTable)
          .where(eq(instructorsTable.tenantId, ctx.user.tenantId))
          .orderBy(desc(instructorsTable.order))
          .limit(1);

        const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

        const [instructor] = await db
          .insert(instructorsTable)
          .values({
            tenantId: ctx.user.tenantId,
            name: ctx.body.name,
            avatar: ctx.body.avatar,
            bio: ctx.body.bio,
            title: ctx.body.title,
            email: ctx.body.email,
            website: ctx.body.website,
            socialLinks: ctx.body.socialLinks,
            order: nextOrder,
          })
          .returning();

        return { instructor: { ...instructor, coursesCount: 0 } };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        avatar: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        title: t.Optional(t.String()),
        email: t.Optional(t.String()),
        website: t.Optional(t.String()),
        socialLinks: t.Optional(
          t.Object({
            twitter: t.Optional(t.String()),
            linkedin: t.Optional(t.String()),
            github: t.Optional(t.String()),
          })
        ),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Create a new instructor",
      },
    }
  )
  .put(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageInstructors =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageInstructors) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can update instructors",
            403
          );
        }

        const [existingInstructor] = await db
          .select()
          .from(instructorsTable)
          .where(
            and(
              eq(instructorsTable.id, ctx.params.id),
              eq(instructorsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingInstructor) {
          throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
        }

        const updateData: Partial<SelectInstructor> = {};
        if (ctx.body.name !== undefined) updateData.name = ctx.body.name;
        if (ctx.body.avatar !== undefined) updateData.avatar = ctx.body.avatar;
        if (ctx.body.bio !== undefined) updateData.bio = ctx.body.bio;
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.email !== undefined) updateData.email = ctx.body.email;
        if (ctx.body.website !== undefined) updateData.website = ctx.body.website;
        if (ctx.body.socialLinks !== undefined)
          updateData.socialLinks = ctx.body.socialLinks;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

        const [updatedInstructor] = await db
          .update(instructorsTable)
          .set(updateData)
          .where(eq(instructorsTable.id, ctx.params.id))
          .returning();

        const [coursesCount] = await db
          .select({ count: count() })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.instructorId, ctx.params.id),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          );

        return {
          instructor: { ...updatedInstructor, coursesCount: coursesCount.count },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        avatar: t.Optional(t.Union([t.String(), t.Null()])),
        bio: t.Optional(t.Union([t.String(), t.Null()])),
        title: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        website: t.Optional(t.Union([t.String(), t.Null()])),
        socialLinks: t.Optional(
          t.Union([
            t.Object({
              twitter: t.Optional(t.String()),
              linkedin: t.Optional(t.String()),
              github: t.Optional(t.String()),
            }),
            t.Null(),
          ])
        ),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Update an instructor",
      },
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManageInstructors =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManageInstructors) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and instructors can delete instructors",
            403
          );
        }

        const [existingInstructor] = await db
          .select()
          .from(instructorsTable)
          .where(
            and(
              eq(instructorsTable.id, ctx.params.id),
              eq(instructorsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingInstructor) {
          throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
        }

        await db
          .delete(instructorsTable)
          .where(eq(instructorsTable.id, ctx.params.id));

        return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Delete an instructor",
      },
    }
  );
