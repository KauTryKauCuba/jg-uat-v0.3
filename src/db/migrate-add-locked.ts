import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding locked column to uat_target_groups...");
  try {
    await db.execute(sql`
      ALTER TABLE uat_target_groups 
      ADD COLUMN IF NOT EXISTS "locked" boolean DEFAULT false NOT NULL;
    `);
    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
