import "dotenv/config";
import { defineConfig } from "drizzle-kit";

dotenv.config();

export default defineConfig({
  schema: path.resolve(__dirname, "src/models/postgres"),
  out: path.resolve(__dirname, "drizzle"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
