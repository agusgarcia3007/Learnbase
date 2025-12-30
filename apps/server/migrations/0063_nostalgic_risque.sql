ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "auth_settings" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "external_auth_provider" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "external_auth_id" text;--> statement-breakpoint
CREATE INDEX "users_external_auth_idx" ON "users" USING btree ("external_auth_provider","external_auth_id","tenant_id");