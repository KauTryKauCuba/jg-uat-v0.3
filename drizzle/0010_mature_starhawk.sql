ALTER TABLE "test_case_categories" ADD COLUMN "target_group" text DEFAULT 'JOBSEEKER' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tester_group" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employer_locked" boolean DEFAULT true NOT NULL;