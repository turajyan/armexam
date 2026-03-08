// Extracts student from Bearer token and attaches to req.student
export function requireStudent(prisma) {
  return async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) {
      return reply.code(401).send({ error: "Требуется авторизация" });
    }
    const student = await prisma.student.findUnique({
      where: { sessionToken: token },
    });
    if (!student) {
      return reply.code(401).send({ error: "Недействительный токен" });
    }
    req.student = student;
  };
}
