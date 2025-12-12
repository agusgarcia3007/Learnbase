import { Elysia } from "elysia";
import { logger } from "./logger";

export const ErrorCode = {
  // Auth errors
  TENANT_NOT_SPECIFIED: "TENANT_NOT_SPECIFIED",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  WRONG_TENANT: "WRONG_TENANT",
  INVALID_REFRESH_TOKEN: "INVALID_REFRESH_TOKEN",
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Authorization errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SUPERADMIN_REQUIRED: "SUPERADMIN_REQUIRED",

  // Tenant errors
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  TENANT_SLUG_EXISTS: "TENANT_SLUG_EXISTS",
  OWNER_ALREADY_HAS_TENANT: "OWNER_ALREADY_HAS_TENANT",

  // Database errors
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  DATABASE_ERROR: "DATABASE_ERROR",

  // System errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  TIMEOUT: "TIMEOUT",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorResponse {
  code: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ error, set, code }) => {
    logger.error("Error occurred", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      code,
    });

    // Handle custom AppError
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        code: error.code,
        message: error.message,
      } satisfies ErrorResponse;
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: error instanceof Error ? error.message : "Validation failed",
      } satisfies ErrorResponse;
    }

    // Handle database errors
    if (error instanceof Error && error.message?.includes("violates")) {
      set.status = 409;
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: "Database constraint violation",
      } satisfies ErrorResponse;
    }

    logger.error("Unhandled error", { error: error instanceof Error ? error.message : String(error) });
    set.status = 500;
    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred",
    } satisfies ErrorResponse;
  }
);
