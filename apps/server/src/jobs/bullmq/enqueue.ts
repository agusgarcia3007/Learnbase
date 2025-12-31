import { db } from "@/db";
import { jobsHistoryTable } from "@/db/schema";
import { emailQueue, stripeQueue, embeddingsQueue, videoAnalysisQueue } from "./queues";
import type { Job } from "../types";

const EMAIL_JOBS = new Set([
  "send-welcome-email",
  "send-tenant-welcome-email",
  "send-feature-submission-email",
  "send-feature-approved-email",
  "send-feature-rejected-email",
  "send-revenuecat-welcome-email",
]);

const STRIPE_JOBS = new Set([
  "create-stripe-customer",
  "create-connected-customer",
  "sync-connected-customer",
]);

const EMBEDDINGS_JOBS = new Set(["generate-course-embedding"]);

const VIDEO_ANALYSIS_JOBS = new Set([
  "video-transcript",
  "video-embedding",
  "subtitle-generation",
  "subtitle-translation",
]);

export async function enqueue(job: Job): Promise<string> {
  const historyId = crypto.randomUUID();

  await db.insert(jobsHistoryTable).values({
    id: historyId,
    jobType: job.type,
    jobData: job.data,
    status: "pending",
  });

  const jobData = { ...job.data, historyId };

  if (EMAIL_JOBS.has(job.type)) {
    await emailQueue.add(job.type, jobData);
  } else if (STRIPE_JOBS.has(job.type)) {
    await stripeQueue.add(job.type, jobData);
  } else if (EMBEDDINGS_JOBS.has(job.type)) {
    await embeddingsQueue.add(job.type, jobData);
  } else if (VIDEO_ANALYSIS_JOBS.has(job.type)) {
    await videoAnalysisQueue.add(job.type, jobData);
  }

  return historyId;
}
