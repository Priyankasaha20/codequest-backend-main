import express from "express";
import { handleWebhook } from "../controllers/webhook.js";

const router = express.Router();

router.post("/", handleWebhook);

export default router;
