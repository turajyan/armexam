-- Performance indexes for /api/questions/stats and grading queue endpoints

CREATE INDEX IF NOT EXISTS "Result_gradingStatus_idx" ON "Result"("gradingStatus");
CREATE INDEX IF NOT EXISTS "Result_examId_idx"        ON "Result"("examId");
CREATE INDEX IF NOT EXISTS "Result_studentId_idx"     ON "Result"("studentId");
CREATE INDEX IF NOT EXISTS "Question_level_idx"       ON "Question"("level");
CREATE INDEX IF NOT EXISTS "Question_status_idx"      ON "Question"("status");
