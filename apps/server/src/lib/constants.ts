import { env } from "./env";

export const TOKEN_EXPIRATION = {
  ACCESS: "15m",
  REFRESH: "7d",
  RESET: "1h",
} as const;

export const JWT_SECRET = env.JWT_SECRET;
export const REFRESH_SECRET = env.REFRESH_SECRET;
export const RESET_SECRET = env.RESET_SECRET;
export const CLIENT_URL = env.CLIENT_URL;

export const SITE_DATA = {
  NAME: "My LMS",
  EMAIL: "no-reply@mylms.com",
} as const;
