import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const profileRoutes = new Elysia()
  .use(authPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
  })
  .get("/", ({ user }) => ({ user }), {
    detail: { tags: ["Profile"], summary: "Get current user profile" },
  });

profileRoutes.put(
  "/",
  async ({ body, userId }) => {
    const [updated] = await db
      .update(usersTable)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      })
      .where(eq(usersTable.id, userId!))
      .returning();
    const { password: _, ...userWithoutPassword } = updated;
    return { user: userWithoutPassword };
  },
  {
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1 })),
      avatar: t.Optional(t.Union([t.String(), t.Null()])),
    }),
    detail: { tags: ["Profile"], summary: "Update current user profile" },
  }
);
