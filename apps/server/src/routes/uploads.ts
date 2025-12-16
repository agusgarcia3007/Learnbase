import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { getPresignedUploadUrl } from "@/lib/upload";

const folderEnum = t.Union([
  t.Literal("avatars"),
  t.Literal("videos"),
  t.Literal("courses"),
  t.Literal("courses/videos"),
  t.Literal("documents"),
  t.Literal("chat-images"),
  t.Literal("learn-chat-images"),
]);

export const uploadsRoutes = new Elysia()
  .use(authPlugin)
  .use(guardPlugin)
  .post(
    "/presign",
    async (ctx) => {
      const { uploadUrl, key } = getPresignedUploadUrl({
        folder: ctx.body.folder,
        userId: ctx.effectiveTenantId || ctx.userId!,
        fileName: ctx.body.fileName,
        contentType: ctx.body.contentType,
      });

      return { uploadUrl, key };
    },
    {
      body: t.Object({
        folder: folderEnum,
        fileName: t.String({ minLength: 1 }),
        contentType: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Uploads"],
        summary: "Get presigned URL for direct S3 upload",
      },
      requireAuth: true,
    }
  );
