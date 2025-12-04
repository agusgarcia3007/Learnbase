ALTER TABLE "tenants" ADD COLUMN "custom_domain" text;--> statement-breakpoint
CREATE INDEX "tenants_custom_domain_idx" ON "tenants" USING btree ("custom_domain");--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_custom_domain_unique" UNIQUE("custom_domain");