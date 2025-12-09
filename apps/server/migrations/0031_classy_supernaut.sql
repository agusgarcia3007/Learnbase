ALTER TABLE "modules" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
CREATE INDEX "modules_embedding_idx" ON "modules" USING hnsw ("embedding" vector_cosine_ops);