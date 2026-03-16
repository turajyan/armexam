import multer from "multer";
import { uploadBuffer, deleteByUrl } from "../lib/s3.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const ALLOWED_MIME = /^(image|audio|video)\//;
const MAX_SIZE_MB   = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Wrap multer for async Fastify
function multerSingle(field) {
  return (req, reply) =>
    new Promise((resolve, reject) => {
      upload.single(field)(req.raw, reply.raw, (err) => {
        if (err) reject(err);
        else     resolve();
      });
    });
}

export default async function mediaRoutes(fastify) {
  const adminHook = requireAdmin(fastify.prisma);

  /**
   * POST /api/media/upload
   * Body: multipart/form-data  field "file"
   * Returns: { url: string, type: "image"|"audio"|"video" }
   */
  fastify.post("/api/media/upload", { preHandler: [adminHook] }, async (req, reply) => {
    try {
      await multerSingle("file")(req, reply);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    const file = req.raw.file;
    if (!file) return reply.code(400).send({ error: "No file provided" });

    const url  = await uploadBuffer(file.buffer, file.originalname, file.mimetype);
    const type = file.mimetype.split("/")[0]; // "image" | "audio" | "video"

    return { url, type };
  });

  /**
   * DELETE /api/media
   * Body: { url: string }
   * Deletes from S3/MinIO — best-effort, always returns 200
   */
  fastify.delete("/api/media", { preHandler: [adminHook] }, async (req, reply) => {
    const { url } = req.body ?? {};
    if (url) {
      try { await deleteByUrl(url); } catch { /* best-effort */ }
    }
    return { ok: true };
  });
}
