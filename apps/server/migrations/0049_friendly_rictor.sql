ALTER TABLE "tenants" ALTER COLUMN "plan" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "plan" DROP NOT NULL;