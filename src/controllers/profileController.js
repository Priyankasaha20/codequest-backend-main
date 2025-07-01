import path from "path";
import Profile from "../models/profile.js";
import { minioClient, bucketName } from "../config/minio.js";

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
    }
    res.json(profile);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const updateProfile = async (req, res) => {
  const { bio, location, academicYear, institute, phoneNumber } = req.body;
  try {
    const updated = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { bio, location, academicYear, institute, phoneNumber },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const uploadProfilePicture = async (req, res) => {
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
    console.error("uploadProfilePicture error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};
