import { db } from "@/db";
import { usersTable, refreshTokensTable } from "@/db/schema";
import { CLIENT_URL } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { sendEmail } from "@/lib/utils";
import { invalidateUserCache } from "@/plugins/auth";
import { jwtPlugin } from "@/plugins/jwt";
import { tenantPlugin } from "@/plugins/tenant";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

export const authRoutes = new Elysia().use(jwtPlugin).use(tenantPlugin);

authRoutes.post(
  "/signup",
  (ctx) =>
    withHandler(ctx, async () => {
      // Parent app signup (no tenant) → owner
      // Tenant signup (with tenant) → student
      const isParentAppSignup = !ctx.tenant;

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, ctx.body.email))
        .limit(1);

      if (existing) {
        throw new AppError(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          "Email already registered",
          409
        );
      }

      const hashedPassword = await Bun.password.hash(ctx.body.password);

      const [user] = await db
        .insert(usersTable)
        .values({
          email: ctx.body.email,
          password: hashedPassword,
          name: ctx.body.name,
          role: isParentAppSignup ? "owner" : "student",
          tenantId: isParentAppSignup ? null : ctx.tenant!.id,
        })
        .returning();

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

      return { user: userWithoutPassword, accessToken, refreshToken };
    }),
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
      name: t.String({ minLength: 1 }),
    }),
    detail: { tags: ["Auth"], summary: "Register a new user" },
  }
);

authRoutes.post(
  "/login",
  (ctx) =>
    withHandler(ctx, async () => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, ctx.body.email))
        .limit(1);

      if (!user) {
        throw new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid credentials",
          400
        );
      }

      const isValid = await Bun.password.verify(ctx.body.password, user.password);
      if (!isValid) {
        throw new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid credentials",
          400
        );
      }

      // Tenant check
      // - Superadmin bypasses always
      // - Owner without tenant can login in parent app
      // - Owner with tenant must login in their tenant
      // - Student must login in their tenant
      if (user.role !== "superadmin") {
        const isOwnerWithoutTenant =
          user.role === "owner" && user.tenantId === null;

        if (isOwnerWithoutTenant) {
          // Owner without tenant can only login in parent app (no tenant)
          if (ctx.tenant) {
            throw new AppError(
              ErrorCode.WRONG_TENANT,
              "Owner without tenant must login in parent app",
              403
            );
          }
        } else {
          // All other users need a tenant context
          if (!ctx.tenant) {
            throw new AppError(
              ErrorCode.TENANT_NOT_SPECIFIED,
              "Tenant not specified",
              400
            );
          }
          if (user.tenantId !== ctx.tenant.id) {
            throw new AppError(
              ErrorCode.WRONG_TENANT,
              "User does not belong to this tenant",
              403
            );
          }
        }
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

      return { user: userWithoutPassword, accessToken, refreshToken };
    }),
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
  (ctx) =>
    withHandler(ctx, async () => {
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
    }),
  {
    body: t.Object({ refreshToken: t.String() }),
    detail: { tags: ["Auth"], summary: "Refresh access token" },
  }
);

authRoutes.post(
  "/forgot-password",
  (ctx) =>
    withHandler(ctx, async () => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, ctx.body.email))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        return { message: "If the email exists, a reset link has been sent" };
      }

      const resetToken = await ctx.resetJwt.sign({ sub: user.id });
      const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      return { message: "If the email exists, a reset link has been sent" };
    }),
  {
    body: t.Object({
      email: t.String({ format: "email" }),
    }),
    detail: { tags: ["Auth"], summary: "Request password reset email" },
  }
);

authRoutes.post(
  "/reset-password",
  (ctx) =>
    withHandler(ctx, async () => {
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
    }),
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
  (ctx) =>
    withHandler(ctx, async () => {
      // Delete refresh token from DB to revoke it
      await db
        .delete(refreshTokensTable)
        .where(eq(refreshTokensTable.token, ctx.body.refreshToken));

      return { message: "Logged out successfully" };
    }),
  {
    body: t.Object({ refreshToken: t.String() }),
    detail: { tags: ["Auth"], summary: "Logout and revoke refresh token" },
  }
);
