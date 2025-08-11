-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('PUTRA', 'PUTRI');

-- AlterTable
ALTER TABLE "Dormitory" ADD COLUMN     "gender" "GenderType" DEFAULT 'PUTRA';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "gender" "GenderType" DEFAULT 'PUTRA';

-- CreateIndex
CREATE INDEX "Student_gender_idx" ON "Student"("gender");
