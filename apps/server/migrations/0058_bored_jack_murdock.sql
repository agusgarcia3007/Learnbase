ALTER TYPE "public"."subscription_status" ADD VALUE 'trial_expired';--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "published" SET DEFAULT true;