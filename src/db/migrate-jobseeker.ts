import "dotenv/config";
import { db } from "../lib/db";
import { uatTargetGroups, testCaseCategories, users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting data migration from JOBSEEKER to JOBSEEKER_WEB...");
  try {
    // 1. Check if JOBSEEKER_WEB already exists
    const webGroup = await db.query.uatTargetGroups.findFirst({
      where: eq(uatTargetGroups.name, "JOBSEEKER_WEB"),
    });

    if (!webGroup) {
      // Check if JOBSEEKER exists
      const oldGroup = await db.query.uatTargetGroups.findFirst({
        where: eq(uatTargetGroups.name, "JOBSEEKER"),
      });

      if (oldGroup) {
        console.log("Renaming existing JOBSEEKER target group to JOBSEEKER_WEB...");
        await db.update(uatTargetGroups)
          .set({ name: "JOBSEEKER_WEB", displayName: "Jobseeker Web", updatedAt: new Date() })
          .where(eq(uatTargetGroups.name, "JOBSEEKER"));
      } else {
        console.log("Creating JOBSEEKER_WEB target group...");
        await db.insert(uatTargetGroups).values({
          name: "JOBSEEKER_WEB",
          displayName: "Jobseeker Web",
        });
      }
    } else {
      console.log("JOBSEEKER_WEB already exists. Ensuring display name is 'Jobseeker Web'...");
      await db.update(uatTargetGroups)
        .set({ displayName: "Jobseeker Web", updatedAt: new Date() })
        .where(eq(uatTargetGroups.name, "JOBSEEKER_WEB"));
    }

    // 2. Update all categories targeting JOBSEEKER to JOBSEEKER_WEB
    await db.update(testCaseCategories)
      .set({ targetGroup: "JOBSEEKER_WEB", updatedAt: new Date() })
      .where(eq(testCaseCategories.targetGroup, "JOBSEEKER"));
    console.log("Updated categories.");

    // 3. Update all users with tester_group JOBSEEKER to JOBSEEKER_WEB
    await db.update(users)
      .set({ testerGroup: "JOBSEEKER_WEB", updatedAt: new Date() })
      .where(eq(users.testerGroup, "JOBSEEKER"));
    console.log("Updated users.");

    // 4. Delete old JOBSEEKER record if it still exists
    await db.delete(uatTargetGroups).where(eq(uatTargetGroups.name, "JOBSEEKER"));

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

main();
