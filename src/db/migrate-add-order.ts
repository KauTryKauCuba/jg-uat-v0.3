import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding order column to uat_target_groups...");
  try {
    // 1. Add order column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE uat_target_groups 
      ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0 NOT NULL;
    `);
    console.log("Column 'order' added (or already existed).");

    // 2. Initialize orders sequentially
    const groups = await db.execute(sql`
      SELECT id FROM uat_target_groups ORDER BY created_at ASC;
    `);

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      await db.execute(sql`
        UPDATE uat_target_groups 
        SET "order" = ${i} 
        WHERE id = ${g.id};
      `);
    }
    console.log(`Initialized order for ${groups.length} groups.`);
    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
