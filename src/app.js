import dotenv from "dotenv";
import express from "express";
import "./config/db.js";
const app = express();
dotenv.config();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
