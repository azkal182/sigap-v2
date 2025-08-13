/*
  Warnings:

  - Added the required column `createdByUserId` to the `Permit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permit" ADD COLUMN     "createdByUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
