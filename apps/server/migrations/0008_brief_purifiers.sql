CREATE TYPE "public"."tenant_theme" AS ENUM('violet', 'blue', 'emerald', 'coral');--> statement-breakpoint
ALTER TABLE "tenants" RENAME COLUMN "primary_color" TO "theme";