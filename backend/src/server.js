import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import questionsRoutes from "./routes/questions.js";
import sectionsRoutes  from "./routes/sections.js";
import studentsRoutes  from "./routes/students.js";
import examsRoutes     from "./routes/exams.js";
import resultsRoutes   from "./routes/results.js";
import registerRoutes  from "./routes/register.js";
import authRoutes      from "./routes/auth.js";
import citiesRoutes    from "./routes/cities.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminsRoutes    from "./routes/admins.js";
import gradingRoutes   from "./routes/grading.js";
import studentStatsRoutes from "./routes/studentStats.js";

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT ?? 3001);

const fastify = Fastify({ logger: true });

// Decorate so routes can access prisma
fastify.decorate("prisma", prisma);

await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:4173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await fastify.register(questionsRoutes);
await fastify.register(sectionsRoutes);
await fastify.register(studentsRoutes);
await fastify.register(examsRoutes);
await fastify.register(resultsRoutes);
await fastify.register(registerRoutes);
await fastify.register(authRoutes);
await fastify.register(citiesRoutes);
await fastify.register(adminAuthRoutes);
await fastify.register(adminsRoutes);
await fastify.register(gradingRoutes);
await fastify.register(studentStatsRoutes);

// Root route
fastify.get("/", async () => ({ message: "ARM Exam API" }));

// Health check
fastify.get("/health", async () => ({ ok: true }));

try {
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}
