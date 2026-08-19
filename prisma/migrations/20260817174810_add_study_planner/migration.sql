-- CreateEnum
CREATE TYPE "StudyPlanStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "studyPlanItemId" TEXT;

-- CreateTable
CREATE TABLE "StudyPlanItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "plannedDuration" INTEGER NOT NULL DEFAULT 3600,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'PLANNED',
    "subjectId" TEXT,
    "taskId" TEXT,
    "goalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlanItem_userId_idx" ON "StudyPlanItem"("userId");

-- CreateIndex
CREATE INDEX "StudyPlanItem_plannedDate_idx" ON "StudyPlanItem"("plannedDate");

-- CreateIndex
CREATE INDEX "StudyPlanItem_status_idx" ON "StudyPlanItem"("status");

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_studyPlanItemId_fkey" FOREIGN KEY ("studyPlanItemId") REFERENCES "StudyPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AcademicTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AcademicGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
