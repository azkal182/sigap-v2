-- AlterEnum
ALTER TYPE "StudentStatus" ADD VALUE 'GRADUATED';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "exitNotes" TEXT,
ADD COLUMN     "exitReason" TEXT;
