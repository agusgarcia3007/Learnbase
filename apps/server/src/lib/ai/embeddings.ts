import { embed, embedMany } from "ai";
import { AI_MODELS, EMBEDDING_DIMENSIONS } from "./models";

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: AI_MODELS.EMBEDDING,
    value: text,
    providerOptions: {
      openai: { dimensions: EMBEDDING_DIMENSIONS },
    },
  });
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: AI_MODELS.EMBEDDING,
    values: texts,
    providerOptions: {
      openai: { dimensions: EMBEDDING_DIMENSIONS },
    },
  });
  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
