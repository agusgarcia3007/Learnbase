import { createGroq } from "@ai-sdk/groq";
import { env } from "../env";

export const groq = createGroq({
  apiKey: env.GROQ_API_KEY,
});
