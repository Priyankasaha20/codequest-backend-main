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
    // Set public read policy for objects under profile/ prefix
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/profile/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
  } catch (err) {
    console.error("❌  Error setting up MinIO bucket or policy:", err);
  }
})();

export { minioClient, bucketName };
