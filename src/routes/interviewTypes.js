import { Router } from "express";
import { listInterviewTypes } from "../controllers/interviewTypesController.js";

const router = Router();
router.get("/",  listInterviewTypes);
export default router;
