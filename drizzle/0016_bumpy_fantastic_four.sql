CREATE TABLE "feedback_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"tester_id" uuid NOT NULL,
	"previous_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sign_off_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sign_off_id" uuid NOT NULL,
	"tester_id" uuid NOT NULL,
	"previous_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tester_feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tester_id" uuid NOT NULL,
	"rating_overall" integer NOT NULL,
	"rating_ease_of_use" integer NOT NULL,
	"rating_instructions" integer NOT NULL,
	"rating_result_form" integer NOT NULL,
	"impressive_aspects" text,
	"improvement_areas" text,
	"other_feedback" text,
	"uat_session_start" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tester_feedbacks_tester_id_unique" UNIQUE("tester_id")
);
--> statement-breakpoint
CREATE TABLE "tester_sign_offs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tester_id" uuid NOT NULL,
	"designation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tester_sign_offs_tester_id_unique" UNIQUE("tester_id")
);
--> statement-breakpoint
ALTER TABLE "test_case_categories" DROP CONSTRAINT "test_case_categories_name_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "feedback_audit_logs" ADD CONSTRAINT "feedback_audit_logs_feedback_id_tester_feedbacks_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."tester_feedbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_audit_logs" ADD CONSTRAINT "feedback_audit_logs_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_audit_logs" ADD CONSTRAINT "sign_off_audit_logs_sign_off_id_tester_sign_offs_id_fk" FOREIGN KEY ("sign_off_id") REFERENCES "public"."tester_sign_offs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_off_audit_logs" ADD CONSTRAINT "sign_off_audit_logs_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tester_feedbacks" ADD CONSTRAINT "tester_feedbacks_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tester_sign_offs" ADD CONSTRAINT "tester_sign_offs_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_case_categories" ADD CONSTRAINT "test_case_categories_name_target_group_unique" UNIQUE("name","target_group");