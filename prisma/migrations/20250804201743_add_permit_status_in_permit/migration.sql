/*
  Warnings:

  - Added the required column `permitSTatus` to the `Permit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('SICK', 'PERMIT', 'GO_HOME');

-- AlterTable
ALTER TABLE "Permit" ADD COLUMN     "permitSTatus" "PermitStatus" NOT NULL;
