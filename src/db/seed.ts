import "dotenv/config";
import { db } from "../lib/db";
import { users, uatTargetGroups } from "./schema";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding database with bcrypt hashed users...");
  
  console.log("Seeding UAT Target Groups...");
  await db.insert(uatTargetGroups).values([
    { name: "JOBSEEKER_WEB", displayName: "Jobseeker Web" },
    { name: "EMPLOYER", displayName: "Employer" },
  ]).onConflictDoNothing();
  
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash("admin123", saltRounds);
  const testerPassword = await bcrypt.hash("tester123", saltRounds);

  // Insert admin
  await db.insert(users).values({
    name: "Admin User",
    email: "admin@jobgiga.com",
    password: adminPassword,
    role: "ADMIN",
  }).onConflictDoNothing();

  // Insert tester
  await db.insert(users).values({
    name: "Tester User",
    email: "tester@jobgiga.com",
    password: testerPassword,
    role: "TESTER",
  }).onConflictDoNothing();

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
