-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" "StudentStatus" DEFAULT 'ACTIVE';
