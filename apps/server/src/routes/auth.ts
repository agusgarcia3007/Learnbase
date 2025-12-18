import { db } from "@/db";
import {
  usersTable,
  refreshTokensTable,
  tenantsTable,
  instructorProfilesTable,
} from "@/db/schema";
import { getWelcomeVerificationEmailHtml } from "@/lib/email-templates";
import { AppError, ErrorCode } from "@/lib/errors";
import { getTenantClientUrl, sendEmail } from "@/lib/utils";
import { enqueue } from "@/jobs";
import { authPlugin, invalidateUserCache } from "@/plugins/auth";
import { jwtPlugin } from "@/plugins/jwt";
import { findTenantById, tenantPlugin } from "@/plugins/tenant";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { isStripeConfigured } from "@/lib/stripe";

const RESERVED_SLUGS = ["www", "api", "admin", "app", "backoffice", "dashboard", "news"];

export const authRoutes = new Elysia()
  .use(jwtPlugin)
  .use(tenantPlugin)
  .use(
    rateLimit({
      max: 10,
      duration: 60_000,
      generator: (req) => {
        const forwarded = req.headers.get("x-forwarded-for");
        if (forwarded) return forwarded.split(",")[0].trim();
        const realIp = req.headers.get("x-real-ip");
        if (realIp) return realIp;
        return "unknown";
      },
    })
  );

authRoutes.get(
  "/check-slug",
  async (ctx) => {
    const slug = ctx.query.slug.toLowerCase().trim();

    if (RESERVED_SLUGS.includes(slug)) {
      return { available: false, reason: "reserved" };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { available: false, reason: "invalid" };
    }

    if (slug.length < 3) {
      return { available: false, reason: "too_short" };
    }

    const [existing] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, slug))
      .limit(1);

    return { available: !existing, reason: existing ? "taken" : null };
  },
  {
    query: t.Object({
      slug: t.String({ minLength: 1 }),
    }),
    detail: { tags: ["Auth"], summary: "Check if slug is available" },
  }
);

authRoutes.post(
  "/signup",
  async (ctx) => {
      const isParentAppSignup = !ctx.tenant;

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(
          isParentAppSignup
            ? and(eq(usersTable.email, ctx.body.email), isNull(usersTable.tenantId))
            : and(eq(usersTable.email, ctx.body.email), eq(usersTable.tenantId, ctx.tenant!.id))
        )
        .limit(1);

      if (existing) {
        throw new AppError(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          "Email already registered",
          409
        );
      }

      const hashedPassword = await Bun.password.hash(ctx.body.password);

      const emailVerificationToken = isParentAppSignup
        ? crypto.randomUUID()
        : null;
      const emailVerificationTokenExpiresAt = isParentAppSignup
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null;

      const [user] = await db
        .insert(usersTable)
        .values({
          email: ctx.body.email,
          password: hashedPassword,
          name: ctx.body.name,
          locale: ctx.body.locale || "en",
          role: isParentAppSignup ? "owner" : "student",
          tenantId: isParentAppSignup ? null : ctx.tenant!.id,
          emailVerificationToken,
          emailVerificationTokenExpiresAt,
        })
        .returning();

      if (isParentAppSignup && emailVerificationToken) {
        await enqueue({
          type: "send-welcome-email",
          data: {
            email: user.email,
            userName: user.name,
            verificationToken: emailVerificationToken,
            clientUrl: getTenantClientUrl(ctx.tenant),
          },
        });
      }

      let tenantSlug: string | null = ctx.tenant?.slug ?? null;
      let userTenantId: string | null = user.tenantId;

      if (isParentAppSignup && ctx.body.tenantName && ctx.body.tenantSlug) {
        const slug = ctx.body.tenantSlug.toLowerCase().trim();

        if (RESERVED_SLUGS.includes(slug)) {
          throw new AppError(ErrorCode.BAD_REQUEST, "This URL is reserved", 400);
        }

        if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 3) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Invalid URL format", 400);
        }

        const [existingSlug] = await db
          .select({ id: tenantsTable.id })
          .from(tenantsTable)
          .where(eq(tenantsTable.slug, slug))
          .limit(1);

        if (existingSlug) {
          throw new AppError(ErrorCode.TENANT_SLUG_EXISTS, "This URL is already taken", 409);
        }

        const [tenant] = await db
          .insert(tenantsTable)
          .values({
            slug,
            name: ctx.body.tenantName,
          })
          .returning();

        await db
          .update(usersTable)
          .set({ tenantId: tenant.id })
          .where(eq(usersTable.id, user.id));

        await db.insert(instructorProfilesTable).values({
          tenantId: tenant.id,
          userId: user.id,
          order: 0,
        });

        if (isStripeConfigured()) {
          await enqueue({
            type: "create-stripe-customer",
            data: {
              tenantId: tenant.id,
              email: user.email,
              name: ctx.body.tenantName,
              slug: tenant.slug,
            },
          });
        }

        tenantSlug = tenant.slug;
        userTenantId = tenant.id;
      }

      const [accessToken, refreshToken] = await Promise.all([
        ctx.jwt.sign({
          sub: user.id,
          role: user.role,
          tenantId: userTenantId,
        }),
        ctx.refreshJwt.sign({
          sub: user.id,
          role: user.role,
          tenantId: userTenantId,
        }),
      ]);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(refreshTokensTable).values({
        token: refreshToken,
        userId: user.id,
        expiresAt,
      });

      const { password: _, ...userWithoutPassword } = user;

      return {
        user: { ...userWithoutPassword, tenantSlug, tenantId: userTenantId },
        accessToken,
        refreshToken,
      };
    },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
      name: t.String({ minLength: 1 }),
      locale: t.Optional(t.String()),
      tenantName: t.Optional(t.String({ minLength: 2 })),
      tenantSlug: t.Optional(t.String({ minLength: 3, maxLength: 50, pattern: "^[a-z0-9-]+$" })),
    }),
    detail: { tags: ["Auth"], summary: "Register a new user" },
  }
);

authRoutes.post(
  "/login",
  async (ctx) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(
          ctx.tenant
            ? and(eq(usersTable.email, ctx.body.email), eq(usersTable.tenantId, ctx.tenant.id))
            : and(eq(usersTable.email, ctx.body.email), inArray(usersTable.role, ["owner", "instructor", "superadmin"]))
        )
        .limit(1);

      if (!user) {
        throw new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid credentials",
          400
        );
      }

      const isValid = await Bun.password.verify(
        ctx.body.password,
        user.password
      );
      if (!isValid) {
        throw new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid credentials",
          400
        );
      }

      const [accessToken, refreshToken] = await Promise.all([
        ctx.jwt.sign({
          sub: user.id,
          role: user.role,
          tenantId: user.tenantId,
        }),
        ctx.refreshJwt.sign({
          sub: user.id,
          role: user.role,
          tenantId: user.tenantId,
        }),
      ]);

      // Store refresh token in DB
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await db.insert(refreshTokensTable).values({
        token: refreshToken,
        userId: user.id,
        expiresAt,
      });

      const { password: _, ...userWithoutPassword } = user;

      let tenantSlug: string | null = null;
      if (ctx.tenant) {
        tenantSlug = ctx.tenant.slug;
      } else if (user.tenantId) {
        const [tenant] = await db
          .select({ slug: tenantsTable.slug })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, user.tenantId))
          .limit(1);
        tenantSlug = tenant?.slug ?? null;
      }

      return { user: { ...userWithoutPassword, tenantSlug }, accessToken, refreshToken };
    },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
    detail: { tags: ["Auth"], summary: "Login with email and password" },
  }
);

authRoutes.post(
  "/refresh",
  async (ctx) => {
      const payload = await ctx.refreshJwt.verify(ctx.body.refreshToken);

      if (!payload || typeof payload.sub !== "string") {
        throw new AppError(
          ErrorCode.INVALID_REFRESH_TOKEN,
          "Invalid or expired refresh token",
          401
        );
      }

      // Validate refresh token exists in DB and hasn't expired - parallel queries
      const [[tokenRecord], [user]] = await Promise.all([
        db
          .select()
          .from(refreshTokensTable)
          .where(eq(refreshTokensTable.token, ctx.body.refreshToken))
          .limit(1),
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, payload.sub))
          .limit(1),
      ]);

      if (!tokenRecord) {
        throw new AppError(
          ErrorCode.INVALID_REFRESH_TOKEN,
          "Refresh token not found or has been revoked",
          401
        );
      }

      if (tokenRecord.expiresAt < new Date()) {
        // Clean up expired token
        await db
          .delete(refreshTokensTable)
          .where(eq(refreshTokensTable.token, ctx.body.refreshToken));

        throw new AppError(
          ErrorCode.INVALID_REFRESH_TOKEN,
          "Refresh token has expired",
          401
        );
      }

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 401);
      }

      const accessToken = await ctx.jwt.sign({
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
      });

      return { accessToken };
    },
  {
    body: t.Object({ refreshToken: t.String() }),
    detail: { tags: ["Auth"], summary: "Refresh access token" },
  }
);

authRoutes.post(
  "/forgot-password",
  async (ctx) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(
          ctx.tenant
            ? and(eq(usersTable.email, ctx.body.email), eq(usersTable.tenantId, ctx.tenant.id))
            : and(eq(usersTable.email, ctx.body.email), inArray(usersTable.role, ["owner", "superadmin"]))
        )
        .limit(1);

      if (!user) {
        return { message: "If the email exists, a reset link has been sent" };
      }

      let tenant = ctx.tenant;
      if (!tenant && user.tenantId) {
        tenant = await findTenantById(user.tenantId);
      }

      const resetToken = await ctx.resetJwt.sign({ sub: user.id });
      const resetUrl = `${getTenantClientUrl(tenant)}/reset-password?token=${resetToken}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        senderName: tenant?.name,
        replyTo: tenant?.contactEmail || undefined,
      });

      return { message: "If the email exists, a reset link has been sent" };
    },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
    }),
    detail: { tags: ["Auth"], summary: "Request password reset email" },
  }
);

authRoutes.post(
  "/reset-password",
  async (ctx) => {
      const payload = await ctx.resetJwt.verify(ctx.body.token);

      if (!payload || typeof payload.sub !== "string") {
        throw new AppError(
          ErrorCode.INVALID_RESET_TOKEN,
          "Invalid or expired reset token",
          401
        );
      }

      // Fetch user and hash password in parallel (independent operations)
      const [[user], hashedPassword] = await Promise.all([
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, payload.sub))
          .limit(1),
        Bun.password.hash(ctx.body.password),
      ]);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
      }

      await db
        .update(usersTable)
        .set({ password: hashedPassword })
        .where(eq(usersTable.id, user.id));

      invalidateUserCache(user.id);

      return { message: "Password has been reset successfully" };
    },
  {
    body: t.Object({
      token: t.String(),
      password: t.String({ minLength: 8 }),
    }),
    detail: { tags: ["Auth"], summary: "Reset password with token" },
  }
);

authRoutes.post(
  "/logout",
  async (ctx) => {
      // Delete refresh token from DB to revoke it
      await db
        .delete(refreshTokensTable)
        .where(eq(refreshTokensTable.token, ctx.body.refreshToken));

      return { message: "Logged out successfully" };
    },
  {
    body: t.Object({ refreshToken: t.String() }),
    detail: { tags: ["Auth"], summary: "Logout and revoke refresh token" },
  }
);

authRoutes.post(
  "/verify-email",
  async (ctx) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.emailVerificationToken, ctx.body.token))
        .limit(1);

      if (!user) {
        throw new AppError(
          ErrorCode.INVALID_VERIFICATION_TOKEN,
          "Invalid verification token",
          400
        );
      }

      if (user.emailVerified) {
        throw new AppError(
          ErrorCode.ALREADY_VERIFIED,
          "Email is already verified",
          400
        );
      }

      if (
        !user.emailVerificationTokenExpiresAt ||
        user.emailVerificationTokenExpiresAt < new Date()
      ) {
        throw new AppError(
          ErrorCode.VERIFICATION_TOKEN_EXPIRED,
          "Verification token has expired",
          400
        );
      }

      await db
        .update(usersTable)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        })
        .where(eq(usersTable.id, user.id));

      invalidateUserCache(user.id);

      return { message: "Email verified successfully" };
    },
  {
    body: t.Object({ token: t.String() }),
    detail: { tags: ["Auth"], summary: "Verify email with token" },
  }
);

authRoutes
  .use(authPlugin)
  .post(
    "/resend-verification",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (ctx.user.emailVerified) {
          throw new AppError(
            ErrorCode.ALREADY_VERIFIED,
            "Email is already verified",
            400
          );
        }

        if (ctx.user.role !== "owner") {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners can request email verification",
            403
          );
        }

        const emailVerificationToken = crypto.randomUUID();
        const emailVerificationTokenExpiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );

        await db
          .update(usersTable)
          .set({
            emailVerificationToken,
            emailVerificationTokenExpiresAt,
          })
          .where(eq(usersTable.id, ctx.user.id));

        const verificationUrl = `${getTenantClientUrl(ctx.tenant)}/verify-email?token=${emailVerificationToken}`;
        await sendEmail({
          to: ctx.user.email,
          subject: "Verify your email",
          html: getWelcomeVerificationEmailHtml({
            userName: ctx.user.name,
            verificationUrl,
          }),
          senderName: ctx.tenant?.name,
          replyTo: ctx.tenant?.contactEmail || undefined,
        });

        invalidateUserCache(ctx.user.id);

        return { message: "Verification email sent" };
      },
    {
      detail: { tags: ["Auth"], summary: "Resend verification email" },
    }
  );
