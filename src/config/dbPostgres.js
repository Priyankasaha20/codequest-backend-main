import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌  DATABASE_URL is not defined in environment");
  process.exit(1);
}

import pg from "pg";
const pool = new pg.Pool({ connectionString });


pool
  .connect()
  .then((client) => {
    console.log("✅  PostgreSQL connected");
    client.release();
  })
  .catch((err) => {
    console.error("❌  PostgreSQL connection error:", err);
    process.exit(1);
  });

// Handle idle errorsso
pool.on("error", (err) => {
  console.error("⚠️  PostgreSQL idle client error:", err);
});

import { drizzle } from "drizzle-orm/node-postgres";
export const db = drizzle(pool);
export { pool };
