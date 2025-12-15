import { s3 } from "./s3";
import { env } from "./env";
import { Cache } from "./cache";

type Base64Upload = {
  base64: string;
  folder: string;
  userId: string;
};

type FileUpload = {
  file: File;
  folder: string;
  userId: string;
};

type MultipartOptions = {
  partSize?: number;
  queueSize?: number;
  retry?: number;
};

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

export async function uploadFileToS3(
  { file, folder, userId }: FileUpload,
  options?: MultipartOptions
): Promise<string> {
  const extension =
    file.name.split(".").pop() || file.type.split("/")[1] || "bin";
  const timestamp = Date.now();
  const key = `${folder}/${userId}/${timestamp}.${extension}`;

  const s3File = s3.file(key);
  const writer = s3File.writer({
    type: file.type,
    partSize: options?.partSize ?? 5 * 1024 * 1024,
    queueSize: options?.queueSize ?? 4,
    retry: options?.retry ?? 3,
  });

  const stream = file.stream();
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    writer.write(value);
  }

  await writer.end();
  return key;
}

const URL_CACHE_TTL = 60 * 60 * 1000;
const urlCache = new Cache<string>(URL_CACHE_TTL, 5000);

export function getPresignedUrl(key: string): string {
  if (env.CDN_BASE_URL) {
    return `${env.CDN_BASE_URL}/${key}`;
  }

  const cached = urlCache.get(key);
  if (cached) {
    return cached;
  }

  const file = s3.file(key);
  const url = file.presign({
    expiresIn: 60 * 60 * 24 * 7,
  });

  urlCache.set(key, url);

  return url;
}

export async function deleteFromS3(key: string): Promise<void> {
  const file = s3.file(key);
  if (await file.exists()) {
    await file.delete();
  }
}
