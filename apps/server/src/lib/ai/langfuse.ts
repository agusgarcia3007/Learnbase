import { LangfuseClient } from "@langfuse/client";

let client: LangfuseClient | null = null;

export function getLangfuseClient(): LangfuseClient {
  if (!client) {
    client = new LangfuseClient();
  }
  return client;
}
