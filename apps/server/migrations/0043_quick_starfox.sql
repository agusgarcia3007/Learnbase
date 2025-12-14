CREATE TYPE "public"."subtitle_language" AS ENUM('en', 'es', 'pt');--> statement-breakpoint
CREATE TYPE "public"."subtitle_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "video_subtitles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"language" "subtitle_language" NOT NULL,
	"is_original" boolean DEFAULT false NOT NULL,
	"vtt_key" text,
	"segments" jsonb,
	"status" "subtitle_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_subtitles" ADD CONSTRAINT "video_subtitles_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_subtitles" ADD CONSTRAINT "video_subtitles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_subtitles_video_id_idx" ON "video_subtitles" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_subtitles_tenant_id_idx" ON "video_subtitles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "video_subtitles_status_idx" ON "video_subtitles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "video_subtitles_video_language_idx" ON "video_subtitles" USING btree ("video_id","language");