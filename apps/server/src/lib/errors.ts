import { Elysia } from "elysia";

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

  // Database errors
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  DATABASE_ERROR: "DATABASE_ERROR",

  // System errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
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
  ({ error, set }) => {
    // Handle custom AppError
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        code: error.code,
        message: error.message,
      } satisfies ErrorResponse;
    }

    // Fallback for unknown errors
    console.error("Unhandled error:", error);
    set.status = 500;
    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred",
    } satisfies ErrorResponse;
  }
);
