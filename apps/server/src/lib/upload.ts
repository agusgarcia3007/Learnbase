import { s3 } from "./s3";
import { env } from "./env";

type Base64Upload = {
  base64: string; // data URL format: data:image/png;base64,xxxxx
  folder: string;
  userId: string;
};

/**
 * Upload base64 image to S3 and return the storage key (not URL).
 * The key should be stored in the database and converted to a presigned URL when needed.
 */
export async function uploadBase64ToS3({
  base64,
  folder,
  userId,
}: Base64Upload): Promise<string> {
  const matches = base64.match(/^data:([^;,]+)((?:;[^;,]+)*);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }

  const baseMimeType = matches[1];
  const mimeParams = matches[2];
  const data = matches[3];
  const extension = baseMimeType.split("/")[1] || "bin";
  const contentType = baseMimeType + mimeParams;

  const buffer = Buffer.from(data, "base64");

  const timestamp = Date.now();
  const key = `${folder}/${userId}/${timestamp}.${extension}`;

  await s3.write(key, buffer, { type: contentType });

  return key;
}

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

export function getPresignedUrl(key: string): string {
  if (env.CDN_BASE_URL) {
    return `${env.CDN_BASE_URL}/${key}`;
  }

  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const file = s3.file(key);
  const url = file.presign({
    expiresIn: 60 * 60 * 24 * 7,
  });

  urlCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL });

  if (urlCache.size > 10000) {
    const now = Date.now();
    for (const [k, v] of urlCache) {
      if (v.expiresAt < now) urlCache.delete(k);
    }
  }

  return url;
}

/**
 * Delete a file from S3 by its key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  const file = s3.file(key);
  if (await file.exists()) {
    await file.delete();
  }
}
