import { Hono } from "hono";
import { getS3Object, type Env } from "./s3";

const app = new Hono<{ Bindings: Env }>();

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  vtt: "text/vtt",
  srt: "text/plain",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

function getContentType(key: string, s3ContentType: string | null): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_CONTENT_TYPES[ext]) {
    return EXTENSION_CONTENT_TYPES[ext];
  }
  return s3ContentType || "application/octet-stream";
}

function addCorsHeaders(headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");
}

app.options("/*", (c) => {
  const headers = new Headers();
  addCorsHeaders(headers);
  return new Response(null, { status: 204, headers });
});

app.get("/*", async (c) => {
  const key = c.req.path.slice(1);

  if (!key) {
    return c.text("Not found", 404);
  }

  const cache = caches.default;
  const cacheKey = new Request(c.req.url.split("?")[0]);

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const headers = new Headers(cachedResponse.headers);
    addCorsHeaders(headers);
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      headers,
    });
  }

  const rangeHeader = c.req.header("range");
  const s3Response = await getS3Object(key, c.env, rangeHeader);

  if (!s3Response.ok && s3Response.status !== 206) {
    return c.text("Not found", 404);
  }

  const headers = new Headers({
    "Content-Type": getContentType(key, s3Response.headers.get("Content-Type")),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  });
  addCorsHeaders(headers);

  const contentLength = s3Response.headers.get("Content-Length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  const contentRange = s3Response.headers.get("Content-Range");
  if (contentRange) {
    headers.set("Content-Range", contentRange);
  }

  const response = new Response(s3Response.body, {
    status: s3Response.status,
    headers,
  });

  if (s3Response.status === 200) {
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
});

export default app;
