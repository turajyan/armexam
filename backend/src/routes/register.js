export default async function registerRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/register/pin/:pin — look up assignment by PIN (used by kiosk/exam app)
  fastify.get("/api/register/pin/:pin", async (req, reply) => {
    const assignment = await prisma.examAssignment.findUnique({
      where: { pin: req.params.pin },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, phone: true,
            country: true, documentType: true, documentNumber: true, level: true,
          },
        },
        exam: {
          select: {
            id: true, title: true, examType: true, level: true,
            duration: true, passingScore: true,
            shuffle: true, showResults: true, allowReview: true,
            showQuestionLevel: true, showQuestionPoints: true,
            showPlacementThreshold: true,
            subpools: true, placementTemplate: true, placementThresholds: true,
            maxAudioReplays: true, maxVideoReplays: true,
            startDate: true, endDate: true, startTime: true, endTime: true,
            examCenter: { select: { id: true, name: true, city: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!assignment) return reply.code(404).send({ error: "PIN не найден" });
    return assignment;
  });
}
