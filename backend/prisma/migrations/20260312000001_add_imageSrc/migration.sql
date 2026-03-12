-- AlterTable: add imageSrc column to Question
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageSrc" TEXT;
