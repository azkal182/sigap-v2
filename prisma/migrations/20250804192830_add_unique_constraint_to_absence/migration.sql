/*
  Warnings:

  - A unique constraint covering the columns `[studentId,scheduleId,absentDate]` on the table `Absence` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "absentDate" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Absence_studentId_scheduleId_absentDate_key" ON "Absence"("studentId", "scheduleId", "absentDate");
