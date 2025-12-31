import { Worker } from "bullmq";
import { connection } from "../connection";
import { db } from "@/db";
import { videosTable, videoSubtitlesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { transcribeVideo } from "@/lib/ai/transcript";
import { getPresignedUrl } from "@/lib/upload";
import type {
  VideoTranscriptJob,
  VideoEmbeddingJob,
  SubtitleGenerationJob,
  SubtitleTranslationJob,
} from "../../types";

type VideoAnalysisJobData =
  | VideoTranscriptJob["data"]
  | VideoEmbeddingJob["data"]
  | SubtitleGenerationJob["data"]
  | SubtitleTranslationJob["data"];

async function processVideoTranscript(data: VideoTranscriptJob["data"]) {
  const videoUrl = getPresignedUrl(data.videoKey);
  const transcript = await transcribeVideo(videoUrl);

  await db
    .update(videosTable)
    .set({ transcript })
    .where(eq(videosTable.id, data.videoId));

  return { videoId: data.videoId, transcriptLength: transcript.length };
}

async function processVideoEmbedding(data: VideoEmbeddingJob["data"]) {
  const [video] = await db
    .select({ title: videosTable.title, description: videosTable.description })
    .from(videosTable)
    .where(eq(videosTable.id, data.videoId))
    .limit(1);

  if (!video) {
    throw new Error(`Video not found: ${data.videoId}`);
  }

  const text = `${video.title} ${video.description || ""}`.trim();
  const embedding = await generateEmbedding(text);

  await db
    .update(videosTable)
    .set({ embedding })
    .where(eq(videosTable.id, data.videoId));

  return { videoId: data.videoId, embeddingSize: embedding.length };
}

async function processSubtitleGeneration(data: SubtitleGenerationJob["data"]) {
  const { generateSubtitles } = await import("@/lib/ai/transcription-timestamps");

  await db
    .update(videoSubtitlesTable)
    .set({ status: "processing" })
    .where(eq(videoSubtitlesTable.id, data.subtitleId));

  const [video] = await db
    .select({ videoKey: videosTable.videoKey })
    .from(videosTable)
    .where(eq(videosTable.id, data.videoId))
    .limit(1);

  if (!video?.videoKey) {
    throw new Error(`Video not found or has no video key: ${data.videoId}`);
  }

  const videoUrl = getPresignedUrl(video.videoKey);
  const result = await generateSubtitles(videoUrl);

  await db
    .update(videoSubtitlesTable)
    .set({
      segments: result.segments,
      vttKey: result.vttKey,
      status: "completed",
    })
    .where(eq(videoSubtitlesTable.id, data.subtitleId));

  return { subtitleId: data.subtitleId, segmentsCount: result.segments.length };
}

async function processSubtitleTranslation(data: SubtitleTranslationJob["data"]) {
  const { translateSubtitles } = await import("@/lib/ai/subtitle-translation");

  await db
    .update(videoSubtitlesTable)
    .set({ status: "processing" })
    .where(eq(videoSubtitlesTable.id, data.subtitleId));

  const [sourceSubtitle] = await db
    .select({ segments: videoSubtitlesTable.segments })
    .from(videoSubtitlesTable)
    .where(eq(videoSubtitlesTable.videoId, data.videoId))
    .limit(1);

  if (!sourceSubtitle?.segments) {
    throw new Error(`Source subtitle not found for video: ${data.videoId}`);
  }

  const result = await translateSubtitles(
    sourceSubtitle.segments,
    data.targetLanguage
  );

  await db
    .update(videoSubtitlesTable)
    .set({
      segments: result.segments,
      vttKey: result.vttKey,
      status: "completed",
    })
    .where(eq(videoSubtitlesTable.id, data.subtitleId));

  return { subtitleId: data.subtitleId, language: data.targetLanguage };
}

export const videoAnalysisWorker = new Worker<VideoAnalysisJobData>(
  "video-analysis",
  async (job) => {
    switch (job.name) {
      case "video-transcript":
        return await processVideoTranscript(job.data as VideoTranscriptJob["data"]);
      case "video-embedding":
        return await processVideoEmbedding(job.data as VideoEmbeddingJob["data"]);
      case "subtitle-generation":
        return await processSubtitleGeneration(job.data as SubtitleGenerationJob["data"]);
      case "subtitle-translation":
        return await processSubtitleTranslation(job.data as SubtitleTranslationJob["data"]);
      default:
        throw new Error(`Unknown video analysis job: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

videoAnalysisWorker.on("completed", (job) => {
  logger.info("Video analysis job completed", {
    name: job.name,
    id: job.id,
    data: job.data,
  });
});

videoAnalysisWorker.on("failed", (job, error) => {
  logger.error("Video analysis job failed", {
    name: job?.name,
    id: job?.id,
    data: job?.data,
    error: error.message,
  });

  if (job?.name === "subtitle-generation" || job?.name === "subtitle-translation") {
    const subtitleId = (job.data as SubtitleGenerationJob["data"]).subtitleId;
    db.update(videoSubtitlesTable)
      .set({ status: "failed", errorMessage: error.message })
      .where(eq(videoSubtitlesTable.id, subtitleId))
      .catch(() => {});
  }
});
