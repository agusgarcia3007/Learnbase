import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { tenantPlugin } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  coursesTable,
  paymentsTable,
  paymentItemsTable,
  enrollmentsTable,
  cartItemsTable,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { stripe, calculatePlatformFee, isStripeConfigured } from "@/lib/stripe";
import { env } from "@/lib/env";
import { getTenantClientUrl } from "@/lib/utils";

export const checkoutRoutes = new Elysia()
  .use(authPlugin)
  .use(tenantPlugin)
  .post(
    "/session",
    async (ctx) => {
        if (!ctx.user || !ctx.tenant) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!stripe || !isStripeConfigured()) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
        }

        if (!ctx.tenant.stripeConnectAccountId || !ctx.tenant.chargesEnabled) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "This academy is not set up to accept payments yet",
            400
          );
        }

        const { courseIds } = ctx.body;

        if (!courseIds.length) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No courses selected", 400);
        }

        const courses = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            price: coursesTable.price,
            currency: coursesTable.currency,
            thumbnail: coursesTable.thumbnail,
          })
          .from(coursesTable)
          .where(
            and(
              inArray(coursesTable.id, courseIds),
              eq(coursesTable.tenantId, ctx.tenant.id),
              eq(coursesTable.status, "published")
            )
          );

        if (courses.length !== courseIds.length) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Some courses are not available", 400);
        }

        const existingEnrollments = await db
          .select({ courseId: enrollmentsTable.courseId })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.userId, ctx.user.id),
              inArray(enrollmentsTable.courseId, courseIds)
            )
          );

        if (existingEnrollments.length > 0) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "You are already enrolled in some of these courses",
            400
          );
        }

        const freeCourses = courses.filter((c) => c.price === 0);
        const paidCourses = courses.filter((c) => c.price > 0);

        if (freeCourses.length > 0 && paidCourses.length === 0) {
          await db.insert(enrollmentsTable).values(
            freeCourses.map((course) => ({
              userId: ctx.user!.id,
              courseId: course.id,
              tenantId: ctx.tenant!.id,
              purchasePrice: 0,
              purchaseCurrency: course.currency,
            }))
          );

          await db
            .delete(cartItemsTable)
            .where(
              and(
                eq(cartItemsTable.userId, ctx.user.id),
                inArray(
                  cartItemsTable.courseId,
                  freeCourses.map((c) => c.id)
                )
              )
            );

          return {
            type: "free",
            message: "Enrolled successfully in free courses",
          };
        }

        const totalAmount = paidCourses.reduce((sum, c) => sum + c.price, 0);
        const platformFee = calculatePlatformFee(totalAmount, ctx.tenant.commissionRate);

        const [payment] = await db
          .insert(paymentsTable)
          .values({
            tenantId: ctx.tenant.id,
            userId: ctx.user.id,
            amount: totalAmount,
            platformFee,
            currency: paidCourses[0]?.currency?.toLowerCase() ?? "usd",
            status: "pending",
            metadata: {
              courseIds: paidCourses.map((c) => c.id),
              courseCount: paidCourses.length,
            },
          })
          .returning();

        await db.insert(paymentItemsTable).values(
          paidCourses.map((course) => ({
            paymentId: payment.id,
            courseId: course.id,
            priceAtPurchase: course.price,
            currencyAtPurchase: course.currency,
          }))
        );

        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            line_items: paidCourses.map((course) => ({
              price_data: {
                currency: course.currency.toLowerCase(),
                product_data: {
                  name: course.title,
                  images: course.thumbnail
                    ? [`${env.CDN_BASE_URL ?? ""}/${course.thumbnail}`]
                    : undefined,
                },
                unit_amount: course.price,
              },
              quantity: 1,
            })),
            payment_intent_data: {
              application_fee_amount: platformFee,
              metadata: {
                paymentId: payment.id,
                tenantId: ctx.tenant.id,
                userId: ctx.user.id,
              },
            },
            success_url: `${getTenantClientUrl(ctx.tenant)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getTenantClientUrl(ctx.tenant)}/courses`,
            metadata: {
              paymentId: payment.id,
              tenantId: ctx.tenant.id,
              userId: ctx.user.id,
              courseIds: JSON.stringify(paidCourses.map((c) => c.id)),
            },
            customer_email: ctx.user.email,
          },
          {
            stripeAccount: ctx.tenant.stripeConnectAccountId,
          }
        );

        await db
          .update(paymentsTable)
          .set({ stripeCheckoutSessionId: session.id })
          .where(eq(paymentsTable.id, payment.id));

        return {
          type: "checkout",
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      },
    {
      body: t.Object({
        courseIds: t.Array(t.String()),
      }),
    }
  )
  .get(
    "/session/:sessionId",
    async (ctx) => {
        if (!ctx.user || !ctx.tenant) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!stripe || !isStripeConfigured()) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Stripe is not configured", 400);
        }

        if (!ctx.tenant.stripeConnectAccountId) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No Connect account", 400);
        }

        const session = await stripe.checkout.sessions.retrieve(
          ctx.params.sessionId,
          {
            stripeAccount: ctx.tenant.stripeConnectAccountId,
          }
        );

        return {
          status: session.status,
          paymentStatus: session.payment_status,
        };
      },
    {
      params: t.Object({
        sessionId: t.String(),
      }),
    }
  )
  .get(
    "/enrollment-status",
    async (ctx) => {
      if (!ctx.user || !ctx.tenant) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const { sessionId } = ctx.query;

      const [payment] = await db
        .select({ id: paymentsTable.id, status: paymentsTable.status })
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.stripeCheckoutSessionId, sessionId),
            eq(paymentsTable.userId, ctx.user.id),
            eq(paymentsTable.tenantId, ctx.tenant.id)
          )
        );

      if (!payment) {
        throw new AppError(ErrorCode.NOT_FOUND, "Payment not found", 404);
      }

      const enrollments = await db
        .select({ id: enrollmentsTable.id })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.paymentId, payment.id));

      return {
        status: enrollments.length > 0 ? "completed" : "pending",
        paymentStatus: payment.status,
        enrollmentCount: enrollments.length,
      };
    },
    {
      query: t.Object({
        sessionId: t.String(),
      }),
    }
  );
