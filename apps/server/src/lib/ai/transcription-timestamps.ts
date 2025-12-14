import { $ } from "bun";
import { experimental_transcribe as transcribe } from "ai";
import { groq } from "./groq";
import { AI_MODELS } from "./models";
import { logger } from "../logger";
import { AppError, ErrorCode } from "../errors";
import type { SubtitleSegment, SubtitleLanguage } from "@/db/schema";

const SPEED_FACTOR = 2.0;
const FFMPEG_TIMEOUT_MS = 180_000;

type TimestampedTranscription = {
  text: string;
  segments: SubtitleSegment[];
  language: SubtitleLanguage;
};

type GroqSegment = {
  start: number;
  end: number;
  text: string;
};

export async function transcribeWithTimestamps(
  videoUrl: string
): Promise<TimestampedTranscription> {
  const start = Date.now();

  logger.info("Starting FFmpeg audio extraction for subtitles");

  const ffmpegProcess =
    $`ffmpeg -threads 0 -analyzeduration 0 -probesize 32768 -i ${videoUrl} -vn -ac 1 -ar 16000 -af "silenceremove=1:0:-50dB:1:1:-50dB,atempo=2.0" -f mp3 -b:a 32k -`
      .quiet()
      .nothrow();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new AppError(ErrorCode.TIMEOUT, "FFmpeg timeout exceeded", 504)
        ),
      FFMPEG_TIMEOUT_MS
    )
  );

  const result = await Promise.race([ffmpegProcess, timeoutPromise]);

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString();
    if (
      stderr.includes("does not contain any stream") ||
      stderr.includes("Output file #0 does not contain any stream")
    ) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "Video does not contain audio. Cannot generate subtitles.",
        400
      );
    }
    logger.error("FFmpeg failed", { exitCode: result.exitCode, stderr });
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "Failed to extract audio from video",
      500
    );
  }

  const ffmpegTime = Date.now() - start;
  logger.info("FFmpeg extraction completed", { ffmpegTime: `${ffmpegTime}ms` });

  const audioBuffer = new Uint8Array(result.stdout);

  logger.info("Starting Groq Whisper transcription with timestamps", {
    audioSize: `${(audioBuffer.length / 1024).toFixed(1)}KB`,
  });

  const whisperStart = Date.now();

  const response = await transcribe({
    model: groq.transcription(AI_MODELS.TRANSCRIPTION),
    audio: audioBuffer,
    providerOptions: {
      groq: {
        timestampGranularities: ["segment"],
      },
    },
  });

  const whisperTime = Date.now() - whisperStart;

  const rawSegments = (response.providerMetadata?.groq?.segments ||
    response.segments ||
    []) as GroqSegment[];

  const segments: SubtitleSegment[] = rawSegments.map((seg) => ({
    start: seg.start * SPEED_FACTOR,
    end: seg.end * SPEED_FACTOR,
    text: seg.text.trim(),
  }));

  const detectedLanguage = normalizeLanguage(
    response.providerMetadata?.groq?.language as string | undefined
  );

  logger.info("Groq Whisper transcription with timestamps completed", {
    whisperTime: `${whisperTime}ms`,
    segmentsCount: segments.length,
    detectedLanguage,
  });

  return {
    text: response.text,
    segments,
    language: detectedLanguage,
  };
}

function normalizeLanguage(language: string | undefined): SubtitleLanguage {
  const lang = language?.toLowerCase() || "en";

  if (lang === "es" || lang === "spanish") return "es";
  if (lang === "pt" || lang === "portuguese") return "pt";

  return "en";
}
