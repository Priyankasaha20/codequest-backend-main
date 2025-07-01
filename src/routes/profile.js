import express from "express";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from "../controllers/profileController.js";

const router = express.Router();


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", isAuth, getProfile);
router.put("/", isAuth, updateProfile);
router.post("/picture", isAuth, upload.single("picture"), uploadProfilePicture);

export default router;
