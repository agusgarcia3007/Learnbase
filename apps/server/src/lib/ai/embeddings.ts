import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { AI_MODELS } from "./models";

let embeddingPipeline: FeatureExtractionPipeline | null = null;

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline("feature-extraction", AI_MODELS.EMBEDDING);
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const result = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(result.data as Float32Array);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const results = await Promise.all(
    texts.map(async (text) => {
      const result = await pipe(text, { pooling: "mean", normalize: true });
      return Array.from(result.data as Float32Array);
    })
  );
  return results;
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
