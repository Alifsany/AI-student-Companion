-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "extractionError" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
