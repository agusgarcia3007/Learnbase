import mammoth from "mammoth";
import { logger } from "@/lib/logger";

const pdfParse = require("pdf-parse");

const MAX_TEXT_LENGTH = 50000;
const FETCH_TIMEOUT = 30000;

export async function extractTextFromDocument(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const start = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const response = await fetch(fileUrl, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const fetchTime = Date.now() - start;

  logger.info("Document fetched", {
    mimeType,
    size: buffer.byteLength,
    fetchTime: `${fetchTime}ms`,
  });

  let text: string;

  if (mimeType === "application/pdf") {
    const pdfData = await pdfParse(Buffer.from(buffer));
    text = pdfData.text;
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    text = result.value;
  } else {
    throw new Error(`Unsupported document type: ${mimeType}`);
  }

  const extractTime = Date.now() - start - fetchTime;
  logger.info("Text extracted", {
    mimeType,
    textLength: text.length,
    extractTime: `${extractTime}ms`,
  });

  const cleanedText = text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedText.length > MAX_TEXT_LENGTH) {
    return cleanedText.slice(0, MAX_TEXT_LENGTH);
  }

  return cleanedText;
}
