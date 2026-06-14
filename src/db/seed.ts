import "dotenv/config";
import { db } from "../lib/db";
import { users } from "./schema";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding database with bcrypt hashed users...");
  
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  const seedTesterPassword = process.env.SEED_TESTER_PASSWORD;

  if (!seedAdminPassword || !seedTesterPassword) {
    console.warn("Skipping database seed: SEED_ADMIN_PASSWORD or SEED_TESTER_PASSWORD not set in environment.");
    process.exit(0);
  }

  const saltRounds = 12;
  const adminPassword = await bcrypt.hash(seedAdminPassword, saltRounds);
  const testerPassword = await bcrypt.hash(seedTesterPassword, saltRounds);

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
