ALTER TYPE "public"."run_status" ADD VALUE 'SUBMITTED' BEFORE 'PASSED';--> statement-breakpoint
ALTER TABLE "test_runs" ADD COLUMN "submitted_at" timestamp;