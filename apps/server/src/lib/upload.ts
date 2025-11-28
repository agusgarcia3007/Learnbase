import { s3 } from "./s3";

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
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }

  const mimeType = matches[1];
  const data = matches[2];
  const extension = mimeType.split("/")[1] || "bin";

  const buffer = Buffer.from(data, "base64");

  const timestamp = Date.now();
  const key = `${folder}/${userId}/${timestamp}.${extension}`;

  await s3.write(key, buffer, { type: mimeType });

  return key;
}

/**
 * Generate a presigned URL for an S3 key (valid for 7 days).
 */
export function getPresignedUrl(key: string): string {
  const file = s3.file(key);
  return file.presign({
    expiresIn: 60 * 60 * 24 * 7, // 7 days (max allowed)
  });
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
