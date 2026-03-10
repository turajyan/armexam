/*
  Warnings:

  - You are about to drop the column `section` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pin]` on the table `ExamAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionToken]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pin` to the `ExamAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "examCenterId" INTEGER,
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExamAssignment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pin" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "section",
ADD COLUMN     "sectionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "gradedAt" TIMESTAMP(3),
ADD COLUMN     "gradedById" INTEGER,
ADD COLUMN     "gradingStatus" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN     "manualGrades" JSONB;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "avatar",
DROP COLUMN "group",
DROP COLUMN "joinedAt",
ADD COLUMN     "country" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "documentNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "documentType" TEXT NOT NULL DEFAULT 'passport',
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sessionToken" TEXT;

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'moderator',
    "centerId" INTEGER,
    "sessionToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCenter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "cityId" INTEGER NOT NULL,

    CONSTRAINT "ExamCenter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_sessionToken_key" ON "Admin"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAssignment_pin_key" ON "ExamAssignment"("pin");

-- CreateIndex
CREATE UNIQUE INDEX "Student_sessionToken_key" ON "Student"("sessionToken");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ExamCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCenter" ADD CONSTRAINT "ExamCenter_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examCenterId_fkey" FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
