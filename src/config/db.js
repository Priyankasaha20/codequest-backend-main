import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not defined in environment");
  process.exit(1);
}

mongoose.set("strictQuery", false);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err);
    process.exit(1);
  });

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnect...");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("✂️  MongoDB connection closed due to application termination");
  process.exit(0);
});

export default mongoose;
