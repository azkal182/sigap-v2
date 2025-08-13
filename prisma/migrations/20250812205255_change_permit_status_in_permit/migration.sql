/*
  Warnings:

  - Changed the type of `permitSTatus` on the `Permit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Permittatus" AS ENUM ('SICK', 'PERMIT');

-- AlterTable
ALTER TABLE "Permit" DROP COLUMN "permitSTatus",
ADD COLUMN     "permitSTatus" "Permittatus" NOT NULL;
