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
} from "@/db/schema";
import { eq, and, count, inArray, desc } from "drizzle-orm";

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

        const enrollments = await db
          .select({
            enrollment: enrollmentsTable,
            course: {
              id: coursesTable.id,
              slug: coursesTable.slug,
              title: coursesTable.title,
              thumbnail: coursesTable.thumbnail,
              level: coursesTable.level,
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

        const courseIds = enrollments.map((e) => e.course.id);
        const modulesCountData =
          courseIds.length > 0
            ? await db
                .select({
                  courseId: courseModulesTable.courseId,
                  count: count(),
                })
                .from(courseModulesTable)
                .where(inArray(courseModulesTable.courseId, courseIds))
                .groupBy(courseModulesTable.courseId)
            : [];

        const modulesCountMap = new Map(
          modulesCountData.map((mc) => [mc.courseId, mc.count])
        );

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
                thumbnail: course.thumbnail,
                level: course.level,
                modulesCount: modulesCountMap.get(course.id) ?? 0,
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

        const [course] = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, courseId),
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.status, "published")
            )
          )
          .limit(1);

        if (!course) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

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

        const [enrollment] = await db
          .insert(enrollmentsTable)
          .values({
            userId: ctx.user.id,
            courseId,
            tenantId: ctx.user.tenantId,
          })
          .returning();

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

        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, ctx.params.courseId)
            )
          )
          .limit(1);

        return { enrollment: enrollment ?? null, isEnrolled: !!enrollment };
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
  .delete(
    "/:courseId",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [deleted] = await db
          .delete(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              eq(enrollmentsTable.courseId, ctx.params.courseId)
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
