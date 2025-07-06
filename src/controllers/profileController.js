import path from "path";
import Profile from "../models/profile.js";
import User from "../models/user.js";
import { minioClient, bucketName } from "../config/minio.js";

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await Profile.create({ user: req.user.id });
    }

    const result = {
      ...profile.toObject(),
      email: req.user.email,
      name: req.user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update profile details
export const updateProfile = async (req, res) => {
  console.log(req.body);

  const {
    bio,
    location,
    academicYear,
    institute,
    phoneNumber,
     isPrivate,
  } = req.body;
  try {
    const updated = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        bio,
        location,
        academicYear,
        institute,
        phoneNumber,
        private: isPrivate,
      },
      { new: true, upsert: true }
    );
    // Include user email and name in response
    const result = {
      ...updated.toObject(),
      email: req.user.email,
      name: req.user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const uploadProfilePicture = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const userId = req.user.id;
  const ext = path.extname(req.file.originalname);
  const objectName = `profile/user${userId}_${Date.now()}${ext}`;
  try {
    await minioClient.putObject(
      bucketName,
      objectName,
      req.file.buffer,
      req.file.size
    );
    // Store the file path for use with media route
    const mediaPath = `/${objectName}`;
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { profilePic: mediaPath },
      { new: true, upsert: true }
    );

    const result = {
      ...profile.toObject(),
      email: req.user.email,
      name: req.user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("uploadProfilePicture error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }
  const userId = req.user.id;
  const ext = path.extname(req.file.originalname);
  const objectName = `resume/user${userId}_resume_${Date.now()}${ext}`;
  try {
    await minioClient.putObject(
      bucketName,
      objectName,
      req.file.buffer,
      req.file.size
    );
    // Store the file path for use with media route
    const mediaPath = `/${objectName}`;
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { resumeUrl: mediaPath },
      { new: true, upsert: true }
    );

    const result = {
      ...profile.toObject(),
      email: req.user.email,
      name: req.user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("uploadResume error:", err);
    res.status(500).json({ error: "Resume upload failed" });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId });
    const user = await User.findById(req.params.userId);

    if (!profile || !user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const result = {
      ...profile.toObject(),
      email: user.email,
      name: user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("getPublicProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
