CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
CREATE INDEX "documents_embedding_idx" ON "documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "quizzes_embedding_idx" ON "quizzes" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "videos_embedding_idx" ON "videos" USING hnsw ("embedding" vector_cosine_ops);