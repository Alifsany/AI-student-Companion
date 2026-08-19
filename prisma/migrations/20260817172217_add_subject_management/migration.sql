-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "creditHours" DOUBLE PRECISION,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "status" "SubjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Subject_status_idx" ON "Subject"("status");
