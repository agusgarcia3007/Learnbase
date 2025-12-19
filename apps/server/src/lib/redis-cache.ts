import { redis } from "./redis";

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    await redis.set(key, JSON.stringify(data));
    await redis.expire(key, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },
};
