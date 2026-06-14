import "dotenv/config";
import { db } from "./src/lib/db";
import { users } from "./src/db/schema";
import bcrypt from "bcrypt";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("All Users in DB:");
  for (const u of allUsers) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    if (u.email === "admin@jobgiga.com") {
      const match = await bcrypt.compare("admin123", u.password);
      console.log(`  Password 'admin123' match status: ${match}`);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
