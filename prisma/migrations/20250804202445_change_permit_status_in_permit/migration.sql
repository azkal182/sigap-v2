/*
  Warnings:

  - Changed the type of `permitSTatus` on the `Permit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Permit" DROP COLUMN "permitSTatus",
ADD COLUMN     "permitSTatus" "AbsenceStatus" NOT NULL;

-- DropEnum
DROP TYPE "PermitStatus";
