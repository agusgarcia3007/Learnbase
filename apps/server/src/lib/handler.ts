import { AppError, ErrorCode } from "./errors";

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
    console.error(`${endpoint} Error:`, error);

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
