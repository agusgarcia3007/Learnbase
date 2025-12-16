CREATE TYPE "public"."ai_feedback_type" AS ENUM('thumbs_up', 'thumbs_down', 'correction', 'preference_stated');--> statement-breakpoint
CREATE TYPE "public"."ai_tone" AS ENUM('formal', 'casual', 'professional', 'academic', 'friendly');--> statement-breakpoint
CREATE TABLE "ai_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"feedback_type" "ai_feedback_type" NOT NULL,
	"session_id" text,
	"trace_id" text,
	"message_index" integer,
	"original_content" text,
	"corrected_content" text,
	"user_instruction" text,
	"extracted_preference" text,
	"preference_confidence" integer,
	"processed_for_profile" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_ai_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"inferred_tone" "ai_tone",
	"title_style" jsonb,
	"description_style" jsonb,
	"module_patterns" jsonb,
	"vocabulary" jsonb,
	"explicit_preferences" jsonb,
	"courses_analyzed" integer DEFAULT 0 NOT NULL,
	"feedback_count" integer DEFAULT 0 NOT NULL,
	"last_analyzed_at" timestamp,
	"profile_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_ai_profiles_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_ai_profiles" ADD CONSTRAINT "tenant_ai_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_feedback_tenant_id_idx" ON "ai_feedback" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_feedback_user_id_idx" ON "ai_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_feedback_processed_idx" ON "ai_feedback" USING btree ("processed_for_profile");--> statement-breakpoint
CREATE INDEX "ai_feedback_created_at_idx" ON "ai_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenant_ai_profiles_tenant_id_idx" ON "tenant_ai_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_ai_profiles_last_analyzed_idx" ON "tenant_ai_profiles" USING btree ("last_analyzed_at");