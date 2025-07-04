-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_villageId_fkey";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "villageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE SET NULL ON UPDATE CASCADE;
