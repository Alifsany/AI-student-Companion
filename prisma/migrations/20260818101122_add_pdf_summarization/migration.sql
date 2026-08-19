-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "summaryError" TEXT,
ADD COLUMN     "summaryGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "summaryText" TEXT;
