-- Rename enums
ALTER TYPE "AssignmentPriority" RENAME TO "TaskPriority";
ALTER TYPE "AssignmentStatus" RENAME TO "TaskStatus";
ALTER TYPE "TaskStatus" RENAME VALUE 'PENDING' TO 'TODO';

-- Create new enum
CREATE TYPE "TaskType" AS ENUM ('ASSIGNMENT', 'QUIZ', 'EXAM', 'PROJECT', 'PRESENTATION', 'STUDY', 'OTHER');

-- Rename the table
ALTER TABLE "Assignment" RENAME TO "AcademicTask";

-- Add the new column
ALTER TABLE "AcademicTask" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'ASSIGNMENT';

-- Rename primary key constraint
ALTER TABLE "AcademicTask" RENAME CONSTRAINT "Assignment_pkey" TO "AcademicTask_pkey";

-- Rename foreign key constraints
ALTER TABLE "AcademicTask" RENAME CONSTRAINT "Assignment_userId_fkey" TO "AcademicTask_userId_fkey";
ALTER TABLE "AcademicTask" RENAME CONSTRAINT "Assignment_subjectId_fkey" TO "AcademicTask_subjectId_fkey";

-- Rename indexes
ALTER INDEX "Assignment_userId_idx" RENAME TO "AcademicTask_userId_idx";
ALTER INDEX "Assignment_subjectId_idx" RENAME TO "AcademicTask_subjectId_idx";
ALTER INDEX "Assignment_dueDate_idx" RENAME TO "AcademicTask_dueDate_idx";
ALTER INDEX "Assignment_status_idx" RENAME TO "AcademicTask_status_idx";
