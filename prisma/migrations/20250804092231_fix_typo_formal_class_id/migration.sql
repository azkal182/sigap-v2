/*
  Warnings:

  - You are about to drop the column `formalCalssId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `FormalCalss` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_formalCalssId_fkey";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "formalCalssId",
ADD COLUMN     "formalClassId" TEXT;

-- DropTable
DROP TABLE "FormalCalss";

-- CreateTable
CREATE TABLE "FormalClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FormalClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormalClass_name_key" ON "FormalClass"("name");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_formalClassId_fkey" FOREIGN KEY ("formalClassId") REFERENCES "FormalClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
