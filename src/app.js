import dotenv from "dotenv";
import express from "express";
const app = express();
dotenv.config();


app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
