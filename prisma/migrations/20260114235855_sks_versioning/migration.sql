-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_userId_fkey";

-- AlterTable
ALTER TABLE "Sks" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "validTo" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Sks_trackId_idx" ON "Sks"("trackId");

-- CreateIndex
CREATE INDEX "Sks_trackId_validFrom_idx" ON "Sks"("trackId", "validFrom");

-- CreateIndex
CREATE INDEX "Sks_trackId_validTo_idx" ON "Sks"("trackId", "validTo");

-- CreateIndex
CREATE INDEX "Sks_trackId_deletedAt_idx" ON "Sks"("trackId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
