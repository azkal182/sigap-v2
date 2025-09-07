/*
  Warnings:

  - A unique constraint covering the columns `[teacherId,scheduleId,dateKey]` on the table `TeacherAbsence` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dateKey` on table `TeacherAbsence` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TeacherAbsence" ALTER COLUMN "dateKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAbsence_teacherId_scheduleId_dateKey_key" ON "TeacherAbsence"("teacherId", "scheduleId", "dateKey");
