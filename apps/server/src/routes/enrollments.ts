import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  enrollmentsTable,
  coursesTable,
  courseModulesTable,
  instructorsTable,
  categoriesTable,
  cartItemsTable,
} from "@/db/schema";
import { eq, and, count, desc, sql, inArray } from "drizzle-orm";
import { getPresignedUrl } from "@/lib/upload";

export const enrollmentsRoutes = new Elysia({ name: "enrollments" })
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

        const modulesCountSq = db
          .select({ count: count() })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.courseId, coursesTable.id));

        const enrollments = await db
          .select({
            enrollment: enrollmentsTable,
            course: {
              id: coursesTable.id,
              slug: coursesTable.slug,
              title: coursesTable.title,
              thumbnail: coursesTable.thumbnail,
              level: coursesTable.level,
              modulesCount: sql<number>`(${modulesCountSq})`.as("modules_count"),
            },
            instructor: {
              name: instructorsTable.name,
              avatar: instructorsTable.avatar,
            },
            category: {
              name: categoriesTable.name,
              slug: categoriesTable.slug,
            },
          })
          .from(enrollmentsTable)
          .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
          .leftJoin(
            instructorsTable,
            eq(coursesTable.instructorId, instructorsTable.id)
          )
          .leftJoin(categoriesTable, eq(coursesTable.categoryId, categoriesTable.id))
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .orderBy(desc(enrollmentsTable.createdAt));

        return {
          enrollments: enrollments.map(
            ({ enrollment, course, instructor, category }) => ({
              id: enrollment.id,
              status: enrollment.status,
              progress: enrollment.progress,
              enrolledAt: enrollment.createdAt,
              completedAt: enrollment.completedAt,
              course: {
                id: course.id,
                slug: course.slug,
                title: course.title,
                thumbnail: course.thumbnail ? getPresignedUrl(course.thumbnail) : null,
                level: course.level,
                modulesCount: course.modulesCount ?? 0,
                instructor: instructor?.name ? instructor : null,
                category: category?.name ? category : null,
              },
            })
          ),
        };
      }),
    {
      detail: { tags: ["Enrollments"], summary: "List user enrollments" },
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

        const { courseId } = ctx.body;

        const validCourseSubquery = db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, courseId),
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.status, "published")
            )
          );

        const [enrollment] = await db
          .insert(enrollmentsTable)
          .values({
            userId: ctx.user.id,
            courseId: sql`(${validCourseSubquery})`,
            tenantId: ctx.user.tenantId,
          })
          .onConflictDoNothing({
            target: [enrollmentsTable.userId, enrollmentsTable.courseId],
          })
          .returning();

        if (!enrollment) {
          const [existing] = await db
            .select({ id: enrollmentsTable.id })
            .from(enrollmentsTable)
            .where(
              and(
                eq(enrollmentsTable.userId, ctx.user.id),
                eq(enrollmentsTable.courseId, courseId)
              )
            )
            .limit(1);

          if (existing) {
            throw new AppError(
              ErrorCode.BAD_REQUEST,
              "Already enrolled in this course",
              409
            );
          }
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        return { enrollment };
      }),
    {
      body: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Enrollments"], summary: "Enroll in a course" },
    }
  )
  .get(
    "/:courseId",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [result] = await db
          .select({ enrollment: enrollmentsTable })
          .from(enrollmentsTable)
          .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, ctx.params.courseId),
              eq(coursesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        return { enrollment: result?.enrollment ?? null, isEnrolled: !!result };
      }),
    {
      params: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Enrollments"],
        summary: "Get enrollment status for a course",
      },
    }
  )
  .post(
    "/batch",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const { courseIds } = ctx.body;

        if (courseIds.length === 0) {
          return { enrollments: [] };
        }

        const validCoursesSubquery = db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            and(
              sql`${coursesTable.id} IN ${courseIds}`,
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.status, "published")
            )
          );

        const validCourses = await validCoursesSubquery;
        const validCourseIds = validCourses.map((c) => c.id);

        if (validCourseIds.length === 0) {
          return { enrollments: [] };
        }

        const enrollments = await db
          .insert(enrollmentsTable)
          .values(
            validCourseIds.map((courseId) => ({
              userId: ctx.user!.id,
              courseId,
              tenantId: ctx.user!.tenantId!,
            }))
          )
          .onConflictDoNothing({
            target: [enrollmentsTable.userId, enrollmentsTable.courseId],
          })
          .returning();

        await db
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user!.id),
              inArray(cartItemsTable.courseId, validCourseIds)
            )
          );

        return { enrollments };
      }),
    {
      body: t.Object({
        courseIds: t.Array(t.String({ format: "uuid" })),
      }),
      detail: { tags: ["Enrollments"], summary: "Enroll in multiple courses" },
    }
  )
  .delete(
    "/:courseId",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [deleted] = await db
          .delete(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, ctx.params.courseId),
              eq(enrollmentsTable.tenantId, ctx.user.tenantId)
            )
          )
          .returning();

        if (!deleted) {
          throw new AppError(ErrorCode.NOT_FOUND, "Enrollment not found", 404);
        }

        return { success: true };
      }),
    {
      params: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Enrollments"], summary: "Unenroll from a course" },
    }
  );
