import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

export const s3 = new S3Client({
  endpoint:    process.env.S3_ENDPOINT,
  region:      process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO and Cloudflare R2
});

/**
 * Upload a buffer and return the public URL.
 * @param {Buffer} buffer
 * @param {string} originalName  — used only to preserve extension
 * @param {string} mimetype
 * @returns {Promise<string>}    — public URL
 */
export async function uploadBuffer(buffer, originalName, mimetype) {
  const ext = path.extname(originalName ?? "");
  const key = `media/${randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      process.env.S3_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimetype,
  }));

  return `${process.env.S3_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file by its public URL (no-op if URL doesn't match bucket).
 * @param {string} url
 */
export async function deleteByUrl(url) {
  const prefix = process.env.S3_PUBLIC_URL + "/";
  if (!url?.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key:    key,
  }));
}
