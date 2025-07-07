import path from "path";
import { db } from "../config/dbPostgres.js";
import { profiles, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { minioClient, bucketName } from "../config/minio.js";

export const getProfile = async (req, res) => {
  try {
    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, req.user.id));

    if (!profile) {
      [profile] = await db
        .insert(profiles)
        .values({ userId: req.user.id })
        .returning();
    }

    const result = {
      ...profile,
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

  const { bio, location, academicYear, institute, phoneNumber, isPrivate } =
    req.body;
  try {
    const [updated] = await db
      .update(profiles)
      .set({
        bio,
        location,
        academicYear,
        institute,
        phoneNumber,
        private: isPrivate,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, req.user.id))
      .returning();

    if (!updated) {
      // Create profile if it doesn't exist
      const [created] = await db
        .insert(profiles)
        .values({
          userId: req.user.id,
          bio,
          location,
          academicYear,
          institute,
          phoneNumber,
          private: isPrivate,
        })
        .returning();

      const result = {
        ...created,
        email: req.user.email,
        name: req.user.name,
      };
      return res.json(result);
    }

    // Include user email and name in response
    const result = {
      ...updated,
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

    let [profile] = await db
      .update(profiles)
      .set({
        profilePic: mediaPath,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!profile) {
      // Create profile if it doesn't exist
      [profile] = await db
        .insert(profiles)
        .values({
          userId: userId,
          profilePic: mediaPath,
        })
        .returning();
    }

    const result = {
      ...profile,
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

    let [profile] = await db
      .update(profiles)
      .set({
        resumeUrl: mediaPath,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!profile) {
      // Create profile if it doesn't exist
      [profile] = await db
        .insert(profiles)
        .values({
          userId: userId,
          resumeUrl: mediaPath,
        })
        .returning();
    }

    const result = {
      ...profile,
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
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, parseInt(req.params.userId)));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(req.params.userId)));

    if (!profile || !user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const result = {
      ...profile,
      email: user.email,
      name: user.name,
    };
    res.json(result);
  } catch (err) {
    console.error("getPublicProfile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
