import { uploadBuffer, deleteByUrl, listObjects } from "../lib/s3.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const ALLOWED_MIME = /^(image|audio|video)\//;
const MAX_SIZE_MB  = 50;

export default async function mediaRoutes(fastify) {
  await fastify.register(import("@fastify/multipart"), {
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  });

  const adminHook = requireAdmin(fastify.prisma);

  /**
   * GET /api/media
   * Returns list of all files from MinIO bucket
   */
  fastify.get("/api/media", { preHandler: [adminHook] }, async (req, reply) => {
    const [files, questions] = await Promise.all([
      listObjects("media/"),
      fastify.prisma.question.findMany({ select: { id: true, media: true } }),
    ]);

    // Build a map: url → count of questions using it
    const usageMap = {};
    for (const q of questions) {
      const mediaArr = Array.isArray(q.media) ? q.media : [];
      for (const m of mediaArr) {
        if (m?.url) usageMap[m.url] = (usageMap[m.url] || 0) + 1;
      }
    }

    return files.map(f => ({ ...f, usedIn: usageMap[f.url] || 0 }));
  });

  /**
   * POST /api/media/upload
   * Body: multipart/form-data  field "file"
   * Returns: { url, type, name, size, uploadedAt, key }
   */
  fastify.post("/api/media/upload", { preHandler: [adminHook] }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file provided" });

    if (!ALLOWED_MIME.test(data.mimetype)) {
      return reply.code(400).send({ error: `Unsupported file type: ${data.mimetype}` });
    }

    const buffer = await data.toBuffer();
    const url    = await uploadBuffer(buffer, data.filename, data.mimetype);
    const type   = data.mimetype.split("/")[0];

    return {
      url,
      type,
      name:       data.filename,
      size:       buffer.length,
      uploadedAt: new Date(),
      key:        url.replace(process.env.S3_PUBLIC_URL + "/", ""),
    };
  });

  /**
   * DELETE /api/media
   * Body: { url }
   */
  fastify.delete("/api/media", { preHandler: [adminHook] }, async (req, reply) => {
    const { url } = req.body ?? {};
    if (url) {
      try { await deleteByUrl(url); } catch { /* best-effort */ }
    }
    return { ok: true };
  });
}
