DROP INDEX "cart_items_course_id_idx";--> statement-breakpoint
DROP INDEX "cart_items_user_course_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_user_course_idx" ON "cart_items" USING btree ("user_id","course_id");