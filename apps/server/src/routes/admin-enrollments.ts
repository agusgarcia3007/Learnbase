import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  enrollmentsTable,
  coursesTable,
  usersTable,
  itemProgressTable,
  moduleItemsTable,
  courseModulesTable,
} from "@/db/schema";
import {
  eq,
  and,
  count,
  desc,
  inArray,
  ilike,
  or,
  sql,
  gte,
  lte,
} from "drizzle-orm";
import { getPresignedUrl } from "@/lib/upload";
import { getPaginationParams, calculatePagination } from "@/lib/filters";

export const adminEnrollmentsRoutes = new Elysia({ name: "admin-enrollments" })
  .use(tenantPlugin)
  .use(authPlugin)
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage enrollments",
            403
          );
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const page = Math.max(1, parseInt(ctx.query.page ?? "1", 10));
        const limit = Math.min(
          100,
          Math.max(1, parseInt(ctx.query.limit ?? "20", 10))
        );
        const { offset } = getPaginationParams(page, limit);

        const conditions = [eq(enrollmentsTable.tenantId, effectiveTenantId)];

        if (ctx.query.status) {
          const statuses = ctx.query.status.split(",");
          conditions.push(
            inArray(
              enrollmentsTable.status,
              statuses as ("active" | "completed" | "cancelled")[]
            )
          );
        }

        if (ctx.query.courseId) {
          conditions.push(eq(enrollmentsTable.courseId, ctx.query.courseId));
        }

        if (ctx.query.userId) {
          conditions.push(eq(enrollmentsTable.userId, ctx.query.userId));
        }

        if (ctx.query.createdAt) {
          const [startDate, endDate] = ctx.query.createdAt.split(",");
          if (startDate) {
            conditions.push(gte(enrollmentsTable.createdAt, new Date(startDate)));
          }
          if (endDate) {
            conditions.push(lte(enrollmentsTable.createdAt, new Date(endDate)));
          }
        }

        const whereCondition = and(...conditions);

        let searchCondition = undefined;
        if (ctx.query.search) {
          const searchTerm = `%${ctx.query.search}%`;
          searchCondition = or(
            ilike(usersTable.name, searchTerm),
            ilike(usersTable.email, searchTerm),
            ilike(coursesTable.title, searchTerm)
          );
        }

        const finalCondition = searchCondition
          ? and(whereCondition, searchCondition)
          : whereCondition;

        const [enrollments, [{ total }]] = await Promise.all([
          db
            .select({
              enrollment: enrollmentsTable,
              user: {
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                avatar: usersTable.avatar,
              },
              course: {
                id: coursesTable.id,
                title: coursesTable.title,
                slug: coursesTable.slug,
                thumbnail: coursesTable.thumbnail,
              },
            })
            .from(enrollmentsTable)
            .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
            .innerJoin(
              coursesTable,
              eq(enrollmentsTable.courseId, coursesTable.id)
            )
            .where(finalCondition)
            .orderBy(desc(enrollmentsTable.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(enrollmentsTable)
            .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
            .innerJoin(
              coursesTable,
              eq(enrollmentsTable.courseId, coursesTable.id)
            )
            .where(finalCondition),
        ]);

        return {
          enrollments: enrollments.map(({ enrollment, user, course }) => ({
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolledAt: enrollment.createdAt,
            completedAt: enrollment.completedAt,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
            },
            course: {
              id: course.id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail
                ? getPresignedUrl(course.thumbnail)
                : null,
            },
          })),
          pagination: calculatePagination(total, page, limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        courseId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin Enrollments"],
        summary: "List all tenant enrollments (owner/admin only)",
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

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const [result] = await db
          .select({
            enrollment: enrollmentsTable,
            user: {
              id: usersTable.id,
              name: usersTable.name,
              email: usersTable.email,
              avatar: usersTable.avatar,
            },
            course: {
              id: coursesTable.id,
              title: coursesTable.title,
              slug: coursesTable.slug,
              thumbnail: coursesTable.thumbnail,
            },
          })
          .from(enrollmentsTable)
          .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
          .innerJoin(
            coursesTable,
            eq(enrollmentsTable.courseId, coursesTable.id)
          )
          .where(
            and(
              eq(enrollmentsTable.id, ctx.params.id),
              eq(enrollmentsTable.tenantId, effectiveTenantId)
            )
          )
          .limit(1);

        if (!result) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            "Enrollment not found",
            404
          );
        }

        const itemsProgress = await db
          .select({
            itemProgress: itemProgressTable,
            item: {
              id: moduleItemsTable.id,
              contentType: moduleItemsTable.contentType,
              order: moduleItemsTable.order,
            },
            module: {
              id: courseModulesTable.moduleId,
            },
          })
          .from(itemProgressTable)
          .innerJoin(
            moduleItemsTable,
            eq(itemProgressTable.moduleItemId, moduleItemsTable.id)
          )
          .innerJoin(
            courseModulesTable,
            eq(moduleItemsTable.moduleId, courseModulesTable.moduleId)
          )
          .where(eq(itemProgressTable.enrollmentId, ctx.params.id))
          .orderBy(moduleItemsTable.order);

        const { enrollment, user, course } = result;

        return {
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolledAt: enrollment.createdAt,
            completedAt: enrollment.completedAt,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
            },
            course: {
              id: course.id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail
                ? getPresignedUrl(course.thumbnail)
                : null,
            },
            itemsProgress: itemsProgress.map(({ itemProgress, item }) => ({
              id: itemProgress.id,
              status: itemProgress.status,
              videoProgress: itemProgress.videoProgress,
              completedAt: itemProgress.completedAt,
              item: {
                id: item.id,
                contentType: item.contentType,
              },
            })),
          },
        };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin Enrollments"],
        summary: "Get enrollment detail with progress",
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

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const [[targetUser], [course]] = await Promise.all([
          db
            .select()
            .from(usersTable)
            .where(
              and(
                eq(usersTable.id, ctx.body.userId),
                eq(usersTable.tenantId, effectiveTenantId)
              )
            )
            .limit(1),
          db
            .select()
            .from(coursesTable)
            .where(
              and(
                eq(coursesTable.id, ctx.body.courseId),
                eq(coursesTable.tenantId, effectiveTenantId),
                eq(coursesTable.status, "published")
              )
            )
            .limit(1),
        ]);

        if (!targetUser) {
          throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
        }

        if (!course) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [enrollment] = await db
          .insert(enrollmentsTable)
          .values({
            userId: ctx.body.userId,
            courseId: ctx.body.courseId,
            tenantId: effectiveTenantId,
          })
          .onConflictDoNothing({
            target: [enrollmentsTable.userId, enrollmentsTable.courseId],
          })
          .returning();

        if (!enrollment) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "User is already enrolled in this course",
            409
          );
        }

        return { enrollment };
      }),
    {
      body: t.Object({
        userId: t.String({ format: "uuid" }),
        courseId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Admin Enrollments"],
        summary: "Create enrollment (owner/admin only)",
      },
    }
  )
  .post(
    "/bulk",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const { userIds, courseIds, userId, courseId } = ctx.body;

        let enrollmentData: { userId: string; courseId: string }[] = [];

        if (userIds && courseId) {
          const validUsers = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(
              and(
                inArray(usersTable.id, userIds),
                eq(usersTable.tenantId, effectiveTenantId)
              )
            );

          const [course] = await db
            .select({ id: coursesTable.id })
            .from(coursesTable)
            .where(
              and(
                eq(coursesTable.id, courseId),
                eq(coursesTable.tenantId, effectiveTenantId),
                eq(coursesTable.status, "published")
              )
            )
            .limit(1);

          if (!course) {
            throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
          }

          enrollmentData = validUsers.map((u) => ({
            userId: u.id,
            courseId: course.id,
          }));
        } else if (userId && courseIds) {
          const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(
              and(
                eq(usersTable.id, userId),
                eq(usersTable.tenantId, effectiveTenantId)
              )
            )
            .limit(1);

          if (!user) {
            throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
          }

          const validCourses = await db
            .select({ id: coursesTable.id })
            .from(coursesTable)
            .where(
              and(
                inArray(coursesTable.id, courseIds),
                eq(coursesTable.tenantId, effectiveTenantId),
                eq(coursesTable.status, "published")
              )
            );

          enrollmentData = validCourses.map((c) => ({
            userId: user.id,
            courseId: c.id,
          }));
        }

        if (enrollmentData.length === 0) {
          return { created: 0 };
        }

        const enrollments = await db
          .insert(enrollmentsTable)
          .values(
            enrollmentData.map((e) => ({
              userId: e.userId,
              courseId: e.courseId,
              tenantId: effectiveTenantId,
            }))
          )
          .onConflictDoNothing({
            target: [enrollmentsTable.userId, enrollmentsTable.courseId],
          })
          .returning();

        return { created: enrollments.length };
      }),
    {
      body: t.Object({
        userIds: t.Optional(
          t.Array(t.String({ format: "uuid" }), { maxItems: 100 })
        ),
        courseIds: t.Optional(
          t.Array(t.String({ format: "uuid" }), { maxItems: 100 })
        ),
        userId: t.Optional(t.String({ format: "uuid" })),
        courseId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Admin Enrollments"],
        summary: "Bulk create enrollments (owner/admin only)",
      },
    }
  )
  .patch(
    "/:id/status",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const [existing] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.id, ctx.params.id),
              eq(enrollmentsTable.tenantId, effectiveTenantId)
            )
          )
          .limit(1);

        if (!existing) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            "Enrollment not found",
            404
          );
        }

        const [updated] = await db
          .update(enrollmentsTable)
          .set({ status: ctx.body.status })
          .where(eq(enrollmentsTable.id, ctx.params.id))
          .returning();

        return { enrollment: updated };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        status: t.Union([t.Literal("active"), t.Literal("cancelled")]),
      }),
      detail: {
        tags: ["Admin Enrollments"],
        summary: "Update enrollment status",
      },
    }
  )
  .get(
    "/export",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const canExport =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canExport) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const effectiveTenantId = ctx.user.tenantId ?? ctx.tenant?.id;

        if (!effectiveTenantId) {
          throw new AppError(
            ErrorCode.TENANT_NOT_FOUND,
            "No tenant context",
            404
          );
        }

        const enrollments = await db
          .select({
            userName: usersTable.name,
            userEmail: usersTable.email,
            courseTitle: coursesTable.title,
            status: enrollmentsTable.status,
            progress: enrollmentsTable.progress,
            enrolledAt: enrollmentsTable.createdAt,
            completedAt: enrollmentsTable.completedAt,
          })
          .from(enrollmentsTable)
          .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
          .innerJoin(
            coursesTable,
            eq(enrollmentsTable.courseId, coursesTable.id)
          )
          .where(eq(enrollmentsTable.tenantId, effectiveTenantId))
          .orderBy(desc(enrollmentsTable.createdAt));

        const headers = [
          "User Name",
          "User Email",
          "Course",
          "Status",
          "Progress",
          "Enrolled At",
          "Completed At",
        ];
        const rows = enrollments.map((e) => [
          e.userName,
          e.userEmail,
          e.courseTitle,
          e.status,
          `${e.progress}%`,
          e.enrolledAt.toISOString(),
          e.completedAt?.toISOString() ?? "",
        ]);

        const csv = [headers, ...rows]
          .map((row) =>
            row
              .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
              .join(",")
          )
          .join("\n");

        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="enrollments-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }),
    {
      detail: {
        tags: ["Admin Enrollments"],
        summary: "Export enrollments to CSV",
      },
    }
  );
