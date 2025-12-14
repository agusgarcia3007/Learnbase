import { generateText } from "ai";
import { groq } from "./groq";
import { AI_MODELS } from "./models";
import { logger } from "../logger";
import type { SubtitleSegment, SubtitleLanguage } from "@/db/schema";

const BATCH_SIZE = 20;

const LANGUAGE_NAMES: Record<SubtitleLanguage, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
};

export async function translateSubtitleSegments(
  segments: SubtitleSegment[],
  sourceLanguage: SubtitleLanguage,
  targetLanguage: SubtitleLanguage
): Promise<SubtitleSegment[]> {
  if (sourceLanguage === targetLanguage) {
    return segments;
  }

  const translatedSegments: SubtitleSegment[] = [];
  const totalBatches = Math.ceil(segments.length / BATCH_SIZE);

  logger.info("Starting subtitle translation", {
    segmentsCount: segments.length,
    batches: totalBatches,
    from: sourceLanguage,
    to: targetLanguage,
  });

  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = segments.slice(i, i + BATCH_SIZE);

    const textsToTranslate = batch
      .map((s, idx) => `[${idx}] ${s.text}`)
      .join("\n");

    const { text } = await generateText({
      model: groq(AI_MODELS.CONTENT_GENERATION),
      system: buildTranslationPrompt(sourceLanguage, targetLanguage),
      prompt: textsToTranslate,
      maxOutputTokens: 2000,
      temperature: 0.3,
    });

    const translatedTexts = parseTranslationResponse(text, batch.length);

    batch.forEach((segment, idx) => {
      translatedSegments.push({
        start: segment.start,
        end: segment.end,
        text: translatedTexts[idx] || segment.text,
      });
    });

    logger.info("Translated batch", {
      batch: `${batchNumber}/${totalBatches}`,
      segments: batch.length,
    });
  }

  return translatedSegments;
}

function buildTranslationPrompt(
  source: SubtitleLanguage,
  target: SubtitleLanguage
): string {
  return `You are a professional subtitle translator.
Translate the following subtitle segments from ${LANGUAGE_NAMES[source]} to ${LANGUAGE_NAMES[target]}.

RULES:
- Preserve the [index] markers exactly as provided
- Keep translations natural and readable for subtitles
- Match the tone and register of the original
- Keep translations concise (subtitles should be easy to read quickly)
- Do not add or remove content
- Do not include any explanations or comments

OUTPUT FORMAT (one line per segment):
[0] translated text
[1] translated text
...`;
}

function parseTranslationResponse(
  response: string,
  expectedCount: number
): string[] {
  const lines = response.split("\n").filter((l) => l.trim());
  const translations: string[] = [];

  for (let i = 0; i < expectedCount; i++) {
    const pattern = new RegExp(`^\\[${i}\\]\\s*(.+)$`);
    const line = lines.find((l) => pattern.test(l.trim()));

    if (line) {
      const match = line.trim().match(pattern);
      translations.push(match?.[1]?.trim() || "");
    } else {
      translations.push("");
    }
  }

  return translations;
}
