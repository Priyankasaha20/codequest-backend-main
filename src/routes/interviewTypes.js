import { Router } from "express";
import {
  listInterviewTypes,
  getInterviewTypeBySlug,
  createInterviewType,
  updateInterviewType,
  deleteInterviewType,
} from "../controllers/interviewTypesController.js";

const router = Router();

// List all interview types
router.get("/", listInterviewTypes);

// Get interview type by slug
router.get("/:slug", getInterviewTypeBySlug);

// Create new interview type
router.post("/", createInterviewType);

// Update interview type
router.put("/:id", updateInterviewType);

// Delete interview type
router.delete("/:id", deleteInterviewType);

export default router;
