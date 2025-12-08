import "dotenv/config";

function required(key: string, minLength = 1): string {
  const value = Bun.env[key];
  if (!value || value.length < minLength) {
    console.error(
      `Missing or invalid env var: ${key} (min length: ${minLength})`
    );
    process.exit(1);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET", 32),
  REFRESH_SECRET: required("REFRESH_SECRET", 32),
  RESET_SECRET: required("RESET_SECRET", 32),
  PORT: required("PORT"),
  CORS_ORIGIN: Bun.env.CORS_ORIGIN,
  BASE_DOMAIN: Bun.env.BASE_DOMAIN || "localhost",
  RESEND_API_KEY: required("RESEND_API_KEY"),
  CLIENT_URL: required("CLIENT_URL"),
  S3_ACCESS_KEY_ID: required("S3_ACCESS_KEY_ID"),
  S3_SECRET_ACCESS_KEY: required("S3_SECRET_ACCESS_KEY"),
  S3_BUCKET_NAME: required("S3_BUCKET_NAME"),
  S3_ENDPOINT_URL: required("S3_ENDPOINT_URL"),
  S3_REGION: required("S3_REGION"),
  CLOUDFLARE_API_TOKEN: required("CLOUDFLARE_API_TOKEN"),
  CLOUDFLARE_ZONE_ID: required("CLOUDFLARE_ZONE_ID"),
  CLOUDFLARE_CNAME_TARGET:
    Bun.env.CLOUDFLARE_CNAME_TARGET || "domains.learnbase.lat",
  RAILWAY_TOKEN: required("RAILWAY_TOKEN"),
  RAILWAY_CLIENT_SERVICE_ID: required("RAILWAY_CLIENT_SERVICE_ID"),
  GROQ_API_KEY: required("GROQ_API_KEY"),
  DEEPGRAM_API_KEY: required("DEEPGRAM_API_KEY"),
};
