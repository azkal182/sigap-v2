/*
  Warnings:

  - A unique constraint covering the columns `[id_anggota]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "id_anggota" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_id_anggota_key" ON "Student"("id_anggota");
