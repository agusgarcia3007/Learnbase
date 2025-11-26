import { env } from "./env"

export const TOKEN_EXPIRATION = {
  ACCESS: "15m",
  REFRESH: "7d",
} as const

export const JWT_SECRET = env.JWT_SECRET
export const REFRESH_SECRET = env.REFRESH_SECRET
