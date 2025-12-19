DO $$ BEGIN
  CREATE TYPE "public"."feature_priority" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."feature_status" AS ENUM('pending', 'ideas', 'in_progress', 'shipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."notification_type" AS ENUM('feature_approved', 'feature_rejected', 'feature_shipped', 'upcoming_features');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_id" uuid NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "feature_status" DEFAULT 'pending' NOT NULL,
	"priority" "feature_priority" DEFAULT 'medium' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"approved_by_id" uuid,
	"rejected_by_id" uuid,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "feature_attachments" ADD CONSTRAINT "feature_attachments_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "features" ADD CONSTRAINT "features_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "features" ADD CONSTRAINT "features_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "features" ADD CONSTRAINT "features_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_attachments_feature_id_idx" ON "feature_attachments" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_votes_feature_id_idx" ON "feature_votes" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_votes_user_id_idx" ON "feature_votes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feature_votes_feature_user_idx" ON "feature_votes" USING btree ("feature_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "features_status_idx" ON "features" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "features_submitted_by_idx" ON "features" USING btree ("submitted_by_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "features_created_at_idx" ON "features" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "features_status_order_idx" ON "features" USING btree ("status","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notifications_user_id_idx" ON "user_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notifications_is_read_idx" ON "user_notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notifications_created_at_idx" ON "user_notifications" USING btree ("created_at");
