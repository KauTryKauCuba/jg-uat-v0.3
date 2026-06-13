import postgres from "postgres";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/jg_uat";

async function main() {
  console.log("Connecting to database to check mobile_uploads...");
  const sql = postgres(connectionString);
  try {
    const rows = await sql`
      SELECT * FROM "mobile_uploads" ORDER BY "created_at" DESC LIMIT 10;
    `;
    console.log("Rows in mobile_uploads:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await sql.end();
  }
}

main();
