-- Clear existing embeddings (384 dims incompatible with 1536)
UPDATE "courses" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
UPDATE "documents" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
UPDATE "modules" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
UPDATE "quizzes" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
UPDATE "videos" SET "embedding" = NULL WHERE "embedding" IS NOT NULL;--> statement-breakpoint
-- Change column dimensions
ALTER TABLE "courses" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);
