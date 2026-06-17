import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating uat_environment table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS uat_environment (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        url text NOT NULL,
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
