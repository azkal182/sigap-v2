/*
  Warnings:

  - A unique constraint covering the columns `[nis]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nis` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "nis" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_nis_key" ON "Student"("nis");
