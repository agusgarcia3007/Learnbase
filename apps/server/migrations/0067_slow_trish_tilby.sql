CREATE INDEX "page_views_tenant_created_idx" ON "page_views" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_expires_idx" ON "refresh_tokens" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "sessions_tenant_started_idx" ON "sessions" USING btree ("tenant_id","started_at");--> statement-breakpoint
CREATE INDEX "video_subtitles_tenant_status_idx" ON "video_subtitles" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "videos_tenant_status_idx" ON "videos" USING btree ("tenant_id","status");