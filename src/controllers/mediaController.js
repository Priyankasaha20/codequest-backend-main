import User from "../models/user.js";
import Profile from "../models/profile.js";
import { minioClient } from "../config/minio.js";


export const serveMedia = async (req, res) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: "File path is required" });
    }

    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      return res.status(400).json({ error: "Invalid file path format" });
    }

    const fileName = pathParts[pathParts.length - 1];
    const userId = fileName.split("_")[0].replace("user", "");

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Could not extract user ID from file path" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (profile.private && (!req.user || req.user._id.toString() !== userId)) {
      return res
        .status(403)
        .json({ error: "Access denied - profile is private" });
    }

    const fileExtension = path.split(".").pop().toLowerCase();
    let contentType = "application/octet-stream";

    switch (fileExtension) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "pdf":
        contentType = "application/pdf";
        break;
      default:
        return res.status(400).json({ error: "Unsupported file type" });
    }


    const bucketName = process.env.MINIO_BUCKET_NAME;
    const objectName = path.startsWith("/") ? path.substring(1) : path;

    try {
      const stream = await minioClient.getObject(bucketName, objectName);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

      stream.pipe(res);
    } catch (minioError) {
      console.error("MinIO error:", minioError);
      if (minioError.code === "NoSuchKey") {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Error retrieving file" });
    }
  } catch (error) {
    console.error("Media serve error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
