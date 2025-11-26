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
  PORT: required("PORT"),
  CORS_ORIGIN: Bun.env.CORS_ORIGIN,
};
