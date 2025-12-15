import { logger } from "@/lib/logger";
import { generateEmbedding } from "../embeddings";

export const SIMILARITY_THRESHOLDS = {
  SEARCH: 0.55,
  DEDUP_CREATE: 0.85,
};

export const MAX_CACHE_SIZE = 100;

export function setCacheWithLimit(cache: Map<string, unknown>, key: string, value: unknown) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

export function createEmbeddingCache() {
  const embeddingCache = new Map<string, number[]>();

  return async function getCachedEmbedding(query: string): Promise<number[]> {
    const key = query.toLowerCase().trim();
    const cached = embeddingCache.get(key);
    if (cached) {
      logger.info("Embedding cache hit", { query: key });
      return cached;
    }
    const embedding = await generateEmbedding(query);
    setCacheWithLimit(embeddingCache, key, embedding);
    return embedding;
  };
}

export const compactResult = <T extends { id: string; title: string; similarity: number; description?: string | null }>(
  item: T
): { id: string; title: string; similarity: number; description?: string } => {
  const base = { id: item.id, title: item.title, similarity: item.similarity };
  if (item.similarity > 0.8 && item.description) {
    return { ...base, description: item.description.slice(0, 100) };
  }
  return base;
};

export type ValidatedContextCourse = {
  id: string;
  title: string;
  status: string;
  level: string | null;
  price: number;
  shortDescription: string | null;
  modules: Array<{ title: string; moduleId: string }>;
};

export type ToolContext = {
  tenantId: string;
  userId: string;
  searchCache: Map<string, unknown>;
  getCachedEmbedding: (query: string) => Promise<number[]>;
  contextCourses?: ValidatedContextCourse[];
};
