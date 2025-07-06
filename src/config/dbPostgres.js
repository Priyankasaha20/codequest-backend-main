import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL connection config
const pool = new pg.Pool({
  host: process.env.PG_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || "codequest",
  user: process.env.PG_USER || "your_pg_user",
  password: process.env.PG_PASSWORD || "your_pg_password",
});

// Initialize Drizzle ORM
export const db = drizzle(pool);
// Export pool for custom session store
export { pool };
