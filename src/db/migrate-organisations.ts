import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating organisations table and updating users schema...");
  try {
    // 1. Create organisations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organisations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL UNIQUE,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Add organisation_id to users
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "organisation_id" uuid REFERENCES organisations(id) ON DELETE SET NULL;
    `);

    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
