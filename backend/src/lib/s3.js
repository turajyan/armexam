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
export async function listObjects(prefix = "media/") {
  const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET,
    Prefix: prefix,
  }));
  return (res.Contents || []).map(obj => ({
    key:          obj.Key,
    size:         obj.Size,
    uploadedAt:   obj.LastModified,
    url:          `${process.env.S3_PUBLIC_URL}/${obj.Key}`,
    name:         obj.Key.split("/").pop(),
    type:         getTypeFromKey(obj.Key),
  }));
}

function getTypeFromKey(key) {
  const ext = key.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","webp","gif","svg","bmp"].includes(ext)) return "image";
  if (["mp3","wav","ogg","m4a","flac","aac"].includes(ext))        return "audio";
  if (["mp4","webm","mov","avi","mkv"].includes(ext))              return "video";
  return "doc";
}

export async function deleteByUrl(url) {
  if (!url) return;
  // Support both absolute (http://...) and relative (/minio/...) public URLs
  const publicUrl = process.env.S3_PUBLIC_URL;
  const bucket    = process.env.S3_BUCKET;
  // Extract key: everything after /BUCKET/ in the URL
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const key = url.slice(idx + marker.length);
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key:    key,
  }));
}
