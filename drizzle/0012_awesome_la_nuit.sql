CREATE TABLE "uat_resource_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"photo_url" text NOT NULL,
	"resume_url" text NOT NULL,
	"ic_url" text NOT NULL,
	"tester_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resource_select_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "uat_resource_sets" ADD CONSTRAINT "uat_resource_sets_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;