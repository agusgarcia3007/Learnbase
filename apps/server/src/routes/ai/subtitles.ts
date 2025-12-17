import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  videosTable,
  videoSubtitlesTable,
  type SelectVideoSubtitle,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { transcribeWithTimestamps } from "@/lib/ai/transcription-timestamps";
import { translateSubtitleSegments } from "@/lib/ai/subtitle-translation";
import { generateVTT } from "@/lib/ai/vtt-generator";
import { uploadBase64ToS3, getPresignedUrl, deleteFromS3 } from "@/lib/upload";
import { logger } from "@/lib/logger";
import {
  isValidLanguageCode,
  getLanguageLabel,
  type SubtitleLanguageCode,
} from "@/lib/languages";

async function processSubtitleGeneration(
  videoId: string,
  videoKey: string,
  subtitleId: string,
  tenantId: string,
  sourceLanguage?: string
) {
  try {
    const videoUrl = getPresignedUrl(videoKey);
    const { segments, language: detectedLanguage } =
      await transcribeWithTimestamps(videoUrl);
    const language = sourceLanguage ?? detectedLanguage;

    const vtt = generateVTT(segments);
    const vttKey = await uploadBase64ToS3({
      base64: `data:text/vtt;charset=utf-8;base64,${Buffer.from(
        vtt,
        "utf-8"
      ).toString("base64")}`,
      folder: "subtitles",
      userId: tenantId,
    });

    await db
      .update(videoSubtitlesTable)
      .set({
        segments,
        language,
        vttKey,
        status: "completed",
      })
      .where(eq(videoSubtitlesTable.id, subtitleId));

    logger.info("Subtitle generation completed", {
      videoId,
      subtitleId,
      language,
    });
  } catch (error) {
    logger.error("Subtitle generation failed", { videoId, subtitleId, error });
    await db
      .update(videoSubtitlesTable)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(videoSubtitlesTable.id, subtitleId));
  }
}

async function processSubtitleTranslation(
  original: SelectVideoSubtitle,
  targetLanguage: string,
  translationId: string,
  tenantId: string
) {
  try {
    const translatedSegments = await translateSubtitleSegments(
      original.segments!,
      original.language,
      targetLanguage
    );

    const vtt = generateVTT(translatedSegments);
    const vttKey = await uploadBase64ToS3({
      base64: `data:text/vtt;charset=utf-8;base64,${Buffer.from(
        vtt,
        "utf-8"
      ).toString("base64")}`,
      folder: "subtitles",
      userId: tenantId,
    });

    await db
      .update(videoSubtitlesTable)
      .set({
        segments: translatedSegments,
        vttKey,
        status: "completed",
      })
      .where(eq(videoSubtitlesTable.id, translationId));

    logger.info("Subtitle translation completed", {
      translationId,
      targetLanguage,
    });
  } catch (error) {
    logger.error("Subtitle translation failed", { translationId, error });
    await db
      .update(videoSubtitlesTable)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(videoSubtitlesTable.id, translationId));
  }
}

export const subtitlesRoutes = new Elysia({ name: "ai-subtitles" })
  .use(authPlugin)
  .post(
    "/videos/:videoId/subtitles/generate",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (!ctx.user.tenantId) {
        throw new AppError(
          ErrorCode.TENANT_NOT_FOUND,
          "User has no tenant",
          404
        );
      }

      const canManage =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManage) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can generate subtitles",
          403
        );
      }

      const [video] = await db
          .select()
          .from(videosTable)
          .where(
            and(
              eq(videosTable.id, ctx.params.videoId),
              eq(videosTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!video) {
          throw new AppError(ErrorCode.NOT_FOUND, "Video not found", 404);
        }

        if (!video.videoKey) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Video has no file uploaded",
            400
          );
        }

        const existing = await db
          .select()
          .from(videoSubtitlesTable)
          .where(
            and(
              eq(videoSubtitlesTable.videoId, video.id),
              eq(videoSubtitlesTable.isOriginal, true)
            )
          )
          .limit(1);

        if (existing.length > 0 && existing[0].status === "completed") {
          throw new AppError(
            ErrorCode.CONFLICT,
            "Original subtitles already exist",
            409
          );
        }

        if (existing.length > 0 && existing[0].status === "processing") {
          throw new AppError(
            ErrorCode.CONFLICT,
            "Subtitle generation already in progress",
            409
          );
        }

        const sourceLanguage = ctx.body?.sourceLanguage;
        if (sourceLanguage && !isValidLanguageCode(sourceLanguage)) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Invalid language code",
            400
          );
        }
        let subtitleId: string;

        if (existing.length > 0) {
          await db
            .update(videoSubtitlesTable)
            .set({ status: "processing", errorMessage: null })
            .where(eq(videoSubtitlesTable.id, existing[0].id));
          subtitleId = existing[0].id;
        } else {
          const [subtitle] = await db
            .insert(videoSubtitlesTable)
            .values({
              videoId: video.id,
              tenantId: ctx.user.tenantId,
              language: sourceLanguage ?? "en",
              isOriginal: true,
              status: "processing",
            })
            .returning();
          subtitleId = subtitle.id;
        }

      processSubtitleGeneration(
        video.id,
        video.videoKey,
        subtitleId,
        ctx.user.tenantId,
        sourceLanguage
      ).catch((err) =>
        logger.error("Background subtitle generation failed", { err })
      );

      return { subtitleId, status: "processing" };
    },
    {
      params: t.Object({ videoId: t.String({ format: "uuid" }) }),
      body: t.Optional(
        t.Object({
          sourceLanguage: t.Optional(t.String()),
        })
      ),
      detail: {
        tags: ["AI"],
        summary: "Generate subtitles for a video",
      },
    }
  )
  .post(
    "/videos/:videoId/subtitles/translate",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (!ctx.user.tenantId) {
        throw new AppError(
          ErrorCode.TENANT_NOT_FOUND,
          "User has no tenant",
          404
        );
      }

      const canManage =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManage) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can translate subtitles",
          403
        );
      }

      const { targetLanguage } = ctx.body;

        if (!isValidLanguageCode(targetLanguage)) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Invalid language code",
            400
          );
        }

        const [original] = await db
          .select()
          .from(videoSubtitlesTable)
          .where(
            and(
              eq(videoSubtitlesTable.videoId, ctx.params.videoId),
              eq(videoSubtitlesTable.isOriginal, true),
              eq(videoSubtitlesTable.status, "completed")
            )
          )
          .limit(1);

        if (!original?.segments) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Generate original subtitles first",
            400
          );
        }

        if (original.language === targetLanguage) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Cannot translate to the same language as original",
            400
          );
        }

        const existingTranslation = await db
          .select()
          .from(videoSubtitlesTable)
          .where(
            and(
              eq(videoSubtitlesTable.videoId, ctx.params.videoId),
              eq(videoSubtitlesTable.language, targetLanguage)
            )
          )
          .limit(1);

        if (
          existingTranslation.length > 0 &&
          existingTranslation[0].status === "completed"
        ) {
          throw new AppError(
            ErrorCode.CONFLICT,
            `Translation to ${getLanguageLabel(targetLanguage)} already exists`,
            409
          );
        }

        if (
          existingTranslation.length > 0 &&
          existingTranslation[0].status === "processing"
        ) {
          throw new AppError(
            ErrorCode.CONFLICT,
            "Translation already in progress",
            409
          );
        }

        let translationId: string;

        if (existingTranslation.length > 0) {
          await db
            .update(videoSubtitlesTable)
            .set({ status: "processing", errorMessage: null })
            .where(eq(videoSubtitlesTable.id, existingTranslation[0].id));
          translationId = existingTranslation[0].id;
        } else {
          const [translation] = await db
            .insert(videoSubtitlesTable)
            .values({
              videoId: ctx.params.videoId,
              tenantId: ctx.user.tenantId,
              language: targetLanguage,
              isOriginal: false,
              status: "processing",
            })
            .returning();
          translationId = translation.id;
        }

      processSubtitleTranslation(
        original,
        targetLanguage,
        translationId,
        ctx.user.tenantId
      ).catch((err) =>
        logger.error("Background subtitle translation failed", { err })
      );

      return { subtitleId: translationId, status: "processing" };
    },
    {
      params: t.Object({ videoId: t.String({ format: "uuid" }) }),
      body: t.Object({
        targetLanguage: t.String(),
      }),
      detail: {
        tags: ["AI"],
        summary: "Translate video subtitles to another language",
      },
    }
  )
  .get(
    "/videos/:videoId/subtitles/:language/vtt",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const { videoId, language } = ctx.params;

      const [subtitle] = await db
        .select()
        .from(videoSubtitlesTable)
        .where(
          and(
            eq(videoSubtitlesTable.videoId, videoId),
            eq(videoSubtitlesTable.language, language),
            eq(videoSubtitlesTable.status, "completed")
          )
        )
        .limit(1);

      if (!subtitle?.vttKey) {
        throw new AppError(ErrorCode.NOT_FOUND, "Subtitle not found", 404);
      }

      return { vttUrl: getPresignedUrl(subtitle.vttKey) };
    },
    {
      params: t.Object({
        videoId: t.String({ format: "uuid" }),
        language: t.String(),
      }),
      detail: {
        tags: ["AI"],
        summary: "Get VTT URL for a specific language",
      },
    }
  )
  .get(
    "/subtitles/:subtitleId/vtt",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const [subtitle] = await db
        .select()
        .from(videoSubtitlesTable)
        .where(eq(videoSubtitlesTable.id, ctx.params.subtitleId))
        .limit(1);

      if (!subtitle) {
        throw new AppError(ErrorCode.NOT_FOUND, "Subtitle not found", 404);
      }

      if (subtitle.vttKey) {
        return { vttUrl: getPresignedUrl(subtitle.vttKey) };
      }

      if (subtitle.segments) {
        const vtt = generateVTT(subtitle.segments);
        return { vtt };
      }

      throw new AppError(ErrorCode.NOT_FOUND, "VTT not available", 404);
    },
    {
      params: t.Object({ subtitleId: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI"],
        summary: "Get VTT file for a specific subtitle",
      },
    }
  )
  .get(
    "/videos/:videoId/subtitles",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      const subtitles = await db
        .select()
        .from(videoSubtitlesTable)
        .where(eq(videoSubtitlesTable.videoId, ctx.params.videoId))
        .orderBy(
          desc(videoSubtitlesTable.isOriginal),
          videoSubtitlesTable.createdAt
        );

      return {
        subtitles: subtitles.map((s) => ({
          id: s.id,
          language: s.language,
          label: getLanguageLabel(s.language as SubtitleLanguageCode),
          isOriginal: s.isOriginal,
          status: s.status,
          vttUrl: s.status === "completed" && s.vttKey ? getPresignedUrl(s.vttKey) : null,
          errorMessage: s.errorMessage,
          createdAt: s.createdAt.toISOString(),
        })),
      };
    },
    {
      params: t.Object({ videoId: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI"],
        summary: "List subtitles for a video",
      },
    }
  )
  .delete(
    "/subtitles/:subtitleId",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (!ctx.user.tenantId) {
        throw new AppError(
          ErrorCode.TENANT_NOT_FOUND,
          "User has no tenant",
          404
        );
      }

      const canManage =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManage) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can delete subtitles",
          403
        );
      }

      const [subtitle] = await db
        .select()
        .from(videoSubtitlesTable)
        .where(
          and(
            eq(videoSubtitlesTable.id, ctx.params.subtitleId),
            eq(videoSubtitlesTable.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!subtitle) {
        throw new AppError(ErrorCode.NOT_FOUND, "Subtitle not found", 404);
      }

      if (subtitle.vttKey) {
        await deleteFromS3(subtitle.vttKey);
      }

      await db
        .delete(videoSubtitlesTable)
        .where(eq(videoSubtitlesTable.id, ctx.params.subtitleId));

      logger.info("Subtitle deleted", {
        subtitleId: ctx.params.subtitleId,
        language: subtitle.language,
      });

      return { success: true };
    },
    {
      params: t.Object({ subtitleId: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["AI"],
        summary: "Delete a subtitle",
      },
    }
  );
