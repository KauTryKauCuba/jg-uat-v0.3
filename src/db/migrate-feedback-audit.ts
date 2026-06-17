import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating feedback_audit_logs table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feedback_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        feedback_id uuid NOT NULL REFERENCES tester_feedbacks(id) ON DELETE CASCADE,
        tester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        previous_data jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
