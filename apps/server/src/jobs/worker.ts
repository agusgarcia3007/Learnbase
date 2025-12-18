import { dequeue } from "./queue";
import { processJob } from "./processors";
import { logger } from "@/lib/logger";

let running = true;

export async function startWorker() {
  logger.info("Job worker started");

  while (running) {
    const job = await dequeue();
    if (!job) continue;

    try {
      await processJob(job);
      logger.info("Job completed", { type: job.type });
    } catch (error) {
      logger.error("Job failed", {
        type: job.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function stopWorker() {
  running = false;
}
