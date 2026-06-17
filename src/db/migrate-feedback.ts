import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating tester_feedbacks table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tester_feedbacks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tester_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        rating_overall integer NOT NULL,
        rating_ease_of_use integer NOT NULL,
        rating_instructions integer NOT NULL,
        rating_result_form integer NOT NULL,
        impressive_aspects text,
        improvement_areas text,
        other_feedback text,
        uat_session_start text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
