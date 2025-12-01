CREATE TYPE "public"."module_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "module_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "module_status" DEFAULT 'draft' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_lessons" ADD CONSTRAINT "module_lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_lessons" ADD CONSTRAINT "module_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "module_lessons_module_id_idx" ON "module_lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "module_lessons_lesson_id_idx" ON "module_lessons" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "module_lessons_order_idx" ON "module_lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "modules_tenant_id_idx" ON "modules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "modules_status_idx" ON "modules" USING btree ("status");