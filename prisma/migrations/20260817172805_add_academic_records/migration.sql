-- CreateTable
CREATE TABLE "AcademicRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "creditHours" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicRecord_userId_idx" ON "AcademicRecord"("userId");

-- CreateIndex
CREATE INDEX "AcademicRecord_subjectId_idx" ON "AcademicRecord"("subjectId");

-- CreateIndex
CREATE INDEX "AcademicRecord_semester_academicYear_idx" ON "AcademicRecord"("semester", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRecord_userId_subjectId_semester_academicYear_key" ON "AcademicRecord"("userId", "subjectId", "semester", "academicYear");

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
