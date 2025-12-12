import { createGroq } from "@ai-sdk/groq";
import { env } from "../env";

async function timeoutFetch(
  url: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
  fetch: timeoutFetch as unknown as typeof fetch,
});
