import { $ } from "bun";
import { experimental_transcribe as transcribe } from "ai";
import { groq } from "./groq";
import { AI_MODELS } from "./models";
import { logger } from "../logger";

export async function transcribeVideo(videoUrl: string): Promise<string> {
  const start = Date.now();

  logger.info("Starting FFmpeg audio extraction");

  const result =
    await $`ffmpeg -threads 0 -analyzeduration 0 -probesize 32768 -i ${videoUrl} -vn -ac 1 -ar 16000 -af "silenceremove=1:0:-50dB:1:1:-50dB,atempo=2.0" -f mp3 -b:a 32k -`.quiet();

  const ffmpegTime = Date.now() - start;
  logger.info("FFmpeg extraction completed", { ffmpegTime: `${ffmpegTime}ms` });

  const audioBuffer = new Uint8Array(result.stdout);

  logger.info("Starting Groq Whisper transcription", {
    audioSize: `${(audioBuffer.length / 1024).toFixed(1)}KB`,
  });

  const whisperStart = Date.now();
  const { text } = await transcribe({
    model: groq.transcription(AI_MODELS.TRANSCRIPTION),
    audio: audioBuffer,
  });
  const whisperTime = Date.now() - whisperStart;

  logger.info("Groq Whisper transcription completed", {
    whisperTime: `${whisperTime}ms`,
    transcriptLength: text.length,
  });

  return text;
}
