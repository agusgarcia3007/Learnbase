import { createGateway } from "ai";
import { env } from "../env";

export const aiGateway = createGateway({
  apiKey: env.AI_GATEWAY_API_KEY,
});
