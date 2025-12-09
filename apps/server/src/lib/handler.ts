import { AppError, ErrorCode } from "./errors";
import { logger } from "./logger";

type HandlerContext = {
  set: { status?: number | string };
  request: Request;
};

export async function withHandler<T>(
  ctx: HandlerContext,
  handler: () => Promise<T>
): Promise<T> {
  const { method, url } = ctx.request;
  const endpoint = `[${method} ${new URL(url).pathname}]`;

  try {
    return await handler();
  } catch (error) {
    logger.error(`${endpoint} Error`, { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.cause) {
      logger.error(`${endpoint} Cause`, { cause: error.cause });
    }
    console.error("Full error:", error);

    if (error instanceof AppError) {
      ctx.set.status = error.statusCode;
      throw error;
    }

    ctx.set.status = 500;
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      500
    );
  }
}
