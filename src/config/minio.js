import dotenv from "dotenv";
import { Client } from "minio";
dotenv.config();

// Initialize MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET_NAME || "codequest-files";

// Ensure bucket exists
(async () => {
  try {
    // Add a small delay to allow MinIO container to fully start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "");
      console.log(`✅  MinIO bucket "${bucketName}" created.`);
    } else {
      console.log(`✅  MinIO bucket "${bucketName}" exists.`);
    }
  } catch (err) {
    console.error("❌  Error ensuring MinIO bucket:", err.message);
    console.log(
      "🔄  MinIO will be available once the container is properly synced."
    );
  }
})();

export { minioClient, bucketName };
