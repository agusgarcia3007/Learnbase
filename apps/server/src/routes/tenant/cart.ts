import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { getPresignedUrl } from "@/lib/upload";
import {
  cartItemsTable,
  coursesTable,
  courseCategoriesTable,
  instructorProfilesTable,
  usersTable,
  categoriesTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const publicCartRoutes = new Elysia()
  .use(tenantPlugin)
  .post(
    "/preview",
    async (ctx) => {
        if (!ctx.tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const { courseIds } = ctx.body;

        if (!courseIds.length) {
          return {
            items: [],
            summary: {
              itemCount: 0,
              total: 0,
              originalTotal: 0,
              currency: "USD",
            },
          };
        }

        const courses = await db
          .select({
            id: coursesTable.id,
            slug: coursesTable.slug,
            title: coursesTable.title,
            thumbnail: coursesTable.thumbnail,
            price: coursesTable.price,
            originalPrice: coursesTable.originalPrice,
            currency: coursesTable.currency,
            instructor: {
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
              inArray(coursesTable.id, courseIds),
              eq(coursesTable.tenantId, ctx.tenant.id),
              eq(coursesTable.status, "published")
            )
          );

        const categoriesData =
          courses.length > 0
            ? await db
                .select({
                  courseId: courseCategoriesTable.courseId,
                  name: categoriesTable.name,
                  slug: categoriesTable.slug,
                })
                .from(courseCategoriesTable)
                .innerJoin(
                  categoriesTable,
                  eq(courseCategoriesTable.categoryId, categoriesTable.id)
                )
                .where(
                  inArray(
                    courseCategoriesTable.courseId,
                    courses.map((c) => c.id)
                  )
                )
            : [];

        const categoriesByCourse = new Map<
          string,
          Array<{ name: string; slug: string }>
        >();
        for (const cat of categoriesData) {
          const existing = categoriesByCourse.get(cat.courseId) ?? [];
          existing.push({ name: cat.name, slug: cat.slug });
          categoriesByCourse.set(cat.courseId, existing);
        }

        const items = courses.map((course) => ({
          id: course.id,
          courseId: course.id,
          createdAt: new Date().toISOString(),
          course: {
            id: course.id,
            slug: course.slug,
            title: course.title,
            thumbnail: course.thumbnail ? getPresignedUrl(course.thumbnail) : null,
            price: course.price,
            originalPrice: course.originalPrice,
            currency: course.currency,
            instructor: course.instructor?.name ? course.instructor : null,
            categories: categoriesByCourse.get(course.id) ?? [],
          },
        }));

        const total = items.reduce((sum, item) => sum + item.course.price, 0);
        const originalTotal = items.reduce(
          (sum, item) => sum + (item.course.originalPrice ?? item.course.price),
          0
        );

        return {
          items,
          summary: {
            itemCount: items.length,
            total,
            originalTotal,
            currency: items[0]?.course.currency ?? "USD",
          },
        };
      },
    {
      body: t.Object({
        courseIds: t.Array(t.String({ format: "uuid" })),
      }),
      detail: { tags: ["Cart"], summary: "Preview cart for guest users" },
    }
  );

export const cartRoutes = new Elysia()
  .use(publicCartRoutes)
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

        const cartItems = await db
          .select({
            id: cartItemsTable.id,
            courseId: cartItemsTable.courseId,
            createdAt: cartItemsTable.createdAt,
            course: {
              id: coursesTable.id,
              slug: coursesTable.slug,
              title: coursesTable.title,
              thumbnail: coursesTable.thumbnail,
              price: coursesTable.price,
              originalPrice: coursesTable.originalPrice,
              currency: coursesTable.currency,
            },
            instructor: {
              name: usersTable.name,
              avatar: usersTable.avatar,
            },
          })
          .from(cartItemsTable)
          .innerJoin(coursesTable, eq(cartItemsTable.courseId, coursesTable.id))
          .leftJoin(
            instructorProfilesTable,
            eq(coursesTable.instructorId, instructorProfilesTable.id)
          )
          .leftJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user.id),
              eq(cartItemsTable.tenantId, ctx.user.tenantId)
            )
          );

        const courseIds = cartItems.map((item) => item.courseId);
        const categoriesData =
          courseIds.length > 0
            ? await db
                .select({
                  courseId: courseCategoriesTable.courseId,
                  name: categoriesTable.name,
                  slug: categoriesTable.slug,
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
          Array<{ name: string; slug: string }>
        >();
        for (const cat of categoriesData) {
          const existing = categoriesByCourse.get(cat.courseId) ?? [];
          existing.push({ name: cat.name, slug: cat.slug });
          categoriesByCourse.set(cat.courseId, existing);
        }

        const items = cartItems.map(({ id, courseId, createdAt, course, instructor }) => ({
          id,
          courseId,
          createdAt,
          course: {
            ...course,
            thumbnail: course.thumbnail ? getPresignedUrl(course.thumbnail) : null,
            instructor: instructor?.name ? instructor : null,
            categories: categoriesByCourse.get(courseId) ?? [],
          },
        }));

      const total = items.reduce((sum, item) => sum + item.course.price, 0);
      const originalTotal = items.reduce(
        (sum, item) => sum + (item.course.originalPrice ?? item.course.price),
        0
      );

      return {
        items,
        summary: {
          itemCount: items.length,
          total,
          originalTotal,
          currency: items[0]?.course.currency ?? "USD",
        },
      };
    },
    {
      detail: { tags: ["Cart"], summary: "Get cart items" },
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

        const [course] = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            and(
              eq(coursesTable.id, ctx.body.courseId),
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.status, "published")
            )
          )
          .limit(1);

        if (!course) {
          throw new AppError(ErrorCode.NOT_FOUND, "Course not found", 404);
        }

        const [cartItem] = await db
          .insert(cartItemsTable)
          .values({
            userId: ctx.user.id,
            tenantId: ctx.user.tenantId,
            courseId: ctx.body.courseId,
          })
          .onConflictDoNothing()
          .returning();

        if (!cartItem) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Course already in cart", 409);
        }

        return { item: cartItem };
      },
    {
      body: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Cart"], summary: "Add course to cart" },
    }
  )
  .delete(
    "/:courseId",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [deleted] = await db
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user.id),
              eq(cartItemsTable.courseId, ctx.params.courseId),
              eq(cartItemsTable.tenantId, ctx.user.tenantId)
            )
          )
          .returning();

        if (!deleted) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not in cart", 404);
        }

        return { success: true };
      },
    {
      params: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
      detail: { tags: ["Cart"], summary: "Remove course from cart" },
    }
  )
  .delete(
    "/",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }
      if (!ctx.user.tenantId) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
      }

      await db
        .delete(cartItemsTable)
        .where(
          and(
            eq(cartItemsTable.userId, ctx.user.id),
            eq(cartItemsTable.tenantId, ctx.user.tenantId)
          )
        );

      return { success: true };
    },
    {
      detail: { tags: ["Cart"], summary: "Clear cart" },
    }
  )
  .post(
    "/merge",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const { courseIds } = ctx.body;

        if (!courseIds.length) {
          return { merged: 0 };
        }

        const validCourses = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(
            and(
              inArray(coursesTable.id, courseIds),
              eq(coursesTable.tenantId, ctx.user.tenantId),
              eq(coursesTable.status, "published")
            )
          );

        if (!validCourses.length) {
          return { merged: 0 };
        }

        const inserted = await db
          .insert(cartItemsTable)
          .values(
            validCourses.map((course) => ({
              userId: ctx.user!.id,
              tenantId: ctx.effectiveTenantId!,
              courseId: course.id,
            }))
          )
          .onConflictDoNothing()
          .returning();

        return { merged: inserted.length };
      },
    {
      body: t.Object({
        courseIds: t.Array(t.String({ format: "uuid" })),
      }),
      detail: { tags: ["Cart"], summary: "Merge guest cart" },
    }
  );
