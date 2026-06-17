import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating tester_sign_offs and sign_off_audit_logs tables...");
  try {
    // 1. Create tester_sign_offs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tester_sign_offs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tester_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        designation text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // 2. Create sign_off_audit_logs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sign_off_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        sign_off_id uuid NOT NULL REFERENCES tester_sign_offs(id) ON DELETE CASCADE,
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
