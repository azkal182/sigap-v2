/*
  Warnings:

  - You are about to drop the column `date` on the `History` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "History" DROP COLUMN "date",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
