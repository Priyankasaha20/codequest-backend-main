import express from "express";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadResume,
  getPublicProfile,
} from "../controllers/profileController.js";
import { checkProfileAccess } from "../middleware/profileAccess.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", isAuth, getProfile);
router.put("/", isAuth, updateProfile);
router.post("/picture", isAuth, upload.single("picture"), uploadProfilePicture);
router.post("/resume", isAuth, upload.single("resume"), uploadResume);
router.get("/:userId", checkProfileAccess, getPublicProfile);

export default router;
