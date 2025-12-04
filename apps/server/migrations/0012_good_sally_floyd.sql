ALTER TABLE "tenants" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "theme" SET DEFAULT 'default'::text;--> statement-breakpoint
UPDATE "tenants" SET "theme" = 'default' WHERE "theme" = 'violet';--> statement-breakpoint
UPDATE "tenants" SET "theme" = 'ocean' WHERE "theme" = 'blue';--> statement-breakpoint
UPDATE "tenants" SET "theme" = 'tangerine' WHERE "theme" = 'coral';--> statement-breakpoint
DROP TYPE "public"."tenant_theme";--> statement-breakpoint
CREATE TYPE "public"."tenant_theme" AS ENUM('default', 'slate', 'rose', 'emerald', 'tangerine', 'ocean');--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "theme" SET DEFAULT 'default'::"public"."tenant_theme";--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "theme" SET DATA TYPE "public"."tenant_theme" USING "theme"::"public"."tenant_theme";