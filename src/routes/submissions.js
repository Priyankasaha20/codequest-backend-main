import express from "express";
import { submitCode, getSubmission } from "../controllers/submission.js";

const router = express.Router();

router.post("/", submitCode);
router.get("/:id", getSubmission);

export default router;
