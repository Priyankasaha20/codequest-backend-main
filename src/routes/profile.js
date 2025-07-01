import express from "express";
import path from "path";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import Profile from "../models/profile.js";
import { minioClient, bucketName } from "../config/minio.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", isAuth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/", isAuth, async (req, res) => {
  const { bio, location, academicYear, institute, phoneNumber } = req.body;
  try {
    const updated = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { bio, location, academicYear, institute, phoneNumber },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/picture", isAuth, upload.single("picture"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const userId = req.user.id;
  const ext = path.extname(req.file.originalname);
  const objectName = `profile/${userId}/${Date.now()}${ext}`;
  try {
    await minioClient.putObject(
      bucketName,
      objectName,
      req.file.buffer,
      req.file.size
    );
    const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
    const host = process.env.MINIO_ENDPOINT || "localhost";
    const port = process.env.MINIO_PORT || "9000";
    const publicUrl = `${protocol}://${host}:${port}/${bucketName}/${objectName}`;
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { profilePic: publicUrl },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
