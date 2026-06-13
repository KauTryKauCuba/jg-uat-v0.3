CREATE TABLE "test_case_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_case_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_category_id_test_case_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."test_case_categories"("id") ON DELETE cascade ON UPDATE no action;