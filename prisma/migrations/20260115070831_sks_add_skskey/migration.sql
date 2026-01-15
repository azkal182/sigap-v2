-- AlterTable
ALTER TABLE "Sks" ADD COLUMN     "sksKey" TEXT;

-- CreateIndex
CREATE INDEX "Sks_trackId_sksKey_idx" ON "Sks"("trackId", "sksKey");
