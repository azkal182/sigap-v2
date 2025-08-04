/*
  Warnings:

  - Added the required column `dormitoryId` to the `ScheduleSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduleSlot" ADD COLUMN     "dormitoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
