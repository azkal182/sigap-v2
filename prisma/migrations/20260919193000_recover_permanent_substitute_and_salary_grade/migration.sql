/*
  Warnings:

  - A unique constraint covering the columns `[substituteTeacherId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SalaryGrade" AS ENUM ('GOLONGAN_A', 'GOLONGAN_B', 'GOLONGAN_C');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "salaryGrade" "SalaryGrade",
ADD COLUMN     "substituteTeacherId" TEXT;

-- CreateTable
CREATE TABLE "SubstituteTeacherAttendance" (
    "id" TEXT NOT NULL,
    "substituteId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstituteTeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubstituteTeacherAttendance_dateKey_idx" ON "SubstituteTeacherAttendance"("dateKey");

-- CreateIndex
CREATE INDEX "SubstituteTeacherAttendance_primaryId_dateKey_idx" ON "SubstituteTeacherAttendance"("primaryId", "dateKey");

-- CreateIndex
CREATE INDEX "SubstituteTeacherAttendance_substituteId_dateKey_idx" ON "SubstituteTeacherAttendance"("substituteId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubstituteTeacherAttendance_substituteId_scheduleId_dateKey_key" ON "SubstituteTeacherAttendance"("substituteId", "scheduleId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_substituteTeacherId_key" ON "Teacher"("substituteTeacherId");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_substituteTeacherId_fkey" FOREIGN KEY ("substituteTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteTeacherAttendance" ADD CONSTRAINT "SubstituteTeacherAttendance_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteTeacherAttendance" ADD CONSTRAINT "SubstituteTeacherAttendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteTeacherAttendance" ADD CONSTRAINT "SubstituteTeacherAttendance_substituteId_fkey" FOREIGN KEY ("substituteId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
