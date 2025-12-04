import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  cartItemsTable,
  coursesTable,
  instructorsTable,
  categoriesTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const cartRoutes = new Elysia()
  .use(authPlugin)
  .get("/", (ctx) =>
    withHandler(ctx, async () => {
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
            name: instructorsTable.name,
            avatar: instructorsTable.avatar,
          },
          category: {
            name: categoriesTable.name,
            slug: categoriesTable.slug,
          },
        })
        .from(cartItemsTable)
        .innerJoin(coursesTable, eq(cartItemsTable.courseId, coursesTable.id))
        .leftJoin(instructorsTable, eq(coursesTable.instructorId, instructorsTable.id))
        .leftJoin(categoriesTable, eq(coursesTable.categoryId, categoriesTable.id))
        .where(
          and(
            eq(cartItemsTable.userId, ctx.user.id),
            eq(cartItemsTable.tenantId, ctx.user.tenantId)
          )
        );

      const items = cartItems.map(({ id, courseId, createdAt, course, instructor, category }) => ({
        id,
        courseId,
        createdAt,
        course: {
          ...course,
          instructor: instructor?.name ? instructor : null,
          category: category?.name ? category : null,
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
    })
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
      }),
    {
      body: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
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
          .delete(cartItemsTable)
          .where(
            and(
              eq(cartItemsTable.userId, ctx.user.id),
              eq(cartItemsTable.courseId, ctx.params.courseId)
            )
          )
          .returning();

        if (!deleted) {
          throw new AppError(ErrorCode.NOT_FOUND, "Item not in cart", 404);
        }

        return { success: true };
      }),
    {
      params: t.Object({
        courseId: t.String({ format: "uuid" }),
      }),
    }
  )
  .delete("/", (ctx) =>
    withHandler(ctx, async () => {
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
    })
  )
  .post(
    "/merge",
    (ctx) =>
      withHandler(ctx, async () => {
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
              tenantId: ctx.user!.tenantId!,
              courseId: course.id,
            }))
          )
          .onConflictDoNothing()
          .returning();

        return { merged: inserted.length };
      }),
    {
      body: t.Object({
        courseIds: t.Array(t.String({ format: "uuid" })),
      }),
    }
  );
