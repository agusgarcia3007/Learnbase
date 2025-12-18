import { redis } from "@/lib/redis";
import type { Job } from "./types";

const QUEUE_KEY = "jobs:queue";

export async function enqueue(job: Job) {
  await redis.lpush(QUEUE_KEY, JSON.stringify(job));
}

export async function dequeue(): Promise<Job | null> {
  const result = await redis.brpop(QUEUE_KEY, 5);
  if (!result) return null;
  return JSON.parse(result[1]) as Job;
}
