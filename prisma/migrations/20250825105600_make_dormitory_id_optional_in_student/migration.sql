-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_dormitoryId_fkey";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "dormitoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
