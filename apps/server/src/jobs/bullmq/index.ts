import { emailWorker } from "./workers/email.worker";
import { stripeWorker } from "./workers/stripe.worker";
import { embeddingsWorker } from "./workers/embeddings.worker";
import { videoAnalysisWorker } from "./workers/video-analysis.worker";
import { logger } from "@/lib/logger";

export async function startWorker() {
  logger.info("BullMQ workers started", {
    queues: ["emails", "stripe", "embeddings", "video-analysis"],
    emailConcurrency: 5,
    stripeConcurrency: 3,
    embeddingsConcurrency: 3,
    videoAnalysisConcurrency: 2,
  });
}

export async function stopWorker() {
  await Promise.all([
    emailWorker.close(),
    stripeWorker.close(),
    embeddingsWorker.close(),
    videoAnalysisWorker.close(),
  ]);
  logger.info("BullMQ workers stopped");
}

export { enqueue } from "./enqueue";
export { bullBoardPlugin } from "./dashboard";
