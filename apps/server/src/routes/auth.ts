import { db } from "@/db";
import { usersTable, refreshTokensTable } from "@/db/schema";
import { CLIENT_URL } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { sendEmail } from "@/lib/utils";
import { jwtPlugin } from "@/plugins/jwt";
import { tenantPlugin } from "@/plugins/tenant";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

export const authRoutes = new Elysia().use(jwtPlugin).use(tenantPlugin);

authRoutes.post(
  "/signup",
  async ({ body, jwt, refreshJwt, tenant }) => {
    if (!tenant) {
      throw new AppError(
        ErrorCode.TENANT_NOT_SPECIFIED,
        "Tenant not specified. Use X-Tenant-Slug header.",
        400
      );
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    if (existing) {
      throw new AppError(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        "Email already registered",
        409
      );
    }

    const hashedPassword = await Bun.password.hash(body.password);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: "student",
        tenantId: tenant.id,
      })
      .returning();

    const accessToken = await jwt.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
    const refreshToken = await refreshJwt.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });

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
  },
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
  async ({ body, jwt, refreshJwt, tenant }) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    if (!user) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid credentials",
        401
      );
    }

    const isValid = await Bun.password.verify(body.password, user.password);
    if (!isValid) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid credentials",
        401
      );
    }

    // Tenant check (superadmin bypasses)
    if (user.role !== "superadmin") {
      if (!tenant) {
        throw new AppError(
          ErrorCode.TENANT_NOT_SPECIFIED,
          "Tenant not specified",
          400
        );
      }
      if (user.tenantId !== tenant.id) {
        throw new AppError(
          ErrorCode.WRONG_TENANT,
          "User does not belong to this tenant",
          403
        );
      }
    }

    const accessToken = await jwt.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
    const refreshToken = await refreshJwt.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });

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
  async ({ body, jwt, refreshJwt }) => {
    const payload = await refreshJwt.verify(body.refreshToken);

    if (!payload || typeof payload.sub !== "string") {
      throw new AppError(
        ErrorCode.INVALID_REFRESH_TOKEN,
        "Invalid or expired refresh token",
        401
      );
    }

    // Validate refresh token exists in DB and hasn't expired
    const [tokenRecord] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.token, body.refreshToken))
      .limit(1);

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
        .where(eq(refreshTokensTable.token, body.refreshToken));

      throw new AppError(
        ErrorCode.INVALID_REFRESH_TOKEN,
        "Refresh token has expired",
        401
      );
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 401);
    }

    const accessToken = await jwt.sign({
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
  async ({ body, resetJwt }) => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const resetToken = await resetJwt.sign({ sub: user.id });
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
  async ({ body, resetJwt }) => {
    const payload = await resetJwt.verify(body.token);

    if (!payload || typeof payload.sub !== "string") {
      throw new AppError(
        ErrorCode.INVALID_RESET_TOKEN,
        "Invalid or expired reset token",
        401
      );
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    const hashedPassword = await Bun.password.hash(body.password);

    await db
      .update(usersTable)
      .set({ password: hashedPassword })
      .where(eq(usersTable.id, user.id));

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
  async ({ body }) => {
    // Delete refresh token from DB to revoke it
    await db
      .delete(refreshTokensTable)
      .where(eq(refreshTokensTable.token, body.refreshToken));

    return { message: "Logged out successfully" };
  },
  {
    body: t.Object({ refreshToken: t.String() }),
    detail: { tags: ["Auth"], summary: "Logout and revoke refresh token" },
  }
);
