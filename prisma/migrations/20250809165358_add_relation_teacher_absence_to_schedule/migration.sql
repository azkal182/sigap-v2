/*
  Warnings:

  - A unique constraint covering the columns `[teacherId,scheduleId,date]` on the table `TeacherAbsence` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduleId` to the `TeacherAbsence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeacherAbsence" ADD COLUMN     "scheduleId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TeacherAbsence_teacherId_idx" ON "TeacherAbsence"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAbsence_scheduleId_idx" ON "TeacherAbsence"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAbsence_teacherId_scheduleId_date_key" ON "TeacherAbsence"("teacherId", "scheduleId", "date");

-- AddForeignKey
ALTER TABLE "TeacherAbsence" ADD CONSTRAINT "TeacherAbsence_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
