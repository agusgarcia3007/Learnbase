import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const profileRoutes = new Elysia({
  prefix: "/profile",
  name: "profile-routes",
})
  .use(authPlugin)
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
  })
  .get("/", ({ user }) => ({ user }), {
    detail: { tags: ["Profile"], summary: "Get current user profile" },
  })
  .put(
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
