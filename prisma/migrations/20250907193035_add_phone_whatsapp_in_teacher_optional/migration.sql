/*
  Warnings:

  - A unique constraint covering the columns `[phoneWhatsapp]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "phoneWhatsapp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_phoneWhatsapp_key" ON "Teacher"("phoneWhatsapp");
