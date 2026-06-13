const postgres = require('postgres');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not defined");
  process.exit(1);
}

console.log("Waiting for PostgreSQL to be ready at connection URL...");

const sql = postgres(connectionString, {
  connect_timeout: 5,
});

async function checkConnection() {
  for (let i = 0; i < 30; i++) {
    try {
      await sql`SELECT 1`;
      console.log("PostgreSQL is ready!");
      await sql.end();
      process.exit(0);
    } catch (err) {
      console.log(`PostgreSQL is not ready yet (attempt ${i + 1}/30): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.error("PostgreSQL connection timeout reached.");
  process.exit(1);
}

checkConnection();
