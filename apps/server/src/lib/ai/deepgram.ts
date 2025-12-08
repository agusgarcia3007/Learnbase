import { createClient } from "@deepgram/sdk";
import { env } from "../env";

export const deepgram = createClient(env.DEEPGRAM_API_KEY);
