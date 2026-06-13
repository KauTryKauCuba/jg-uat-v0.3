ALTER TYPE "public"."field_type" ADD VALUE 'DROPDOWN';--> statement-breakpoint
ALTER TYPE "public"."field_type" ADD VALUE 'CHECKLIST';--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "test_fields" ADD COLUMN "choices" jsonb;--> statement-breakpoint
ALTER TABLE "test_fields" ADD COLUMN "steps" jsonb;--> statement-breakpoint
ALTER TABLE "test_fields" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;