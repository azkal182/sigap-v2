-- AlterTable
ALTER TABLE "ScheduleSubstitution" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "mergeGroupId" TEXT;

-- CreateTable
CREATE TABLE "SubstitutionBatch" (
    "id" TEXT NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "scope" TEXT NOT NULL,
    "reason" TEXT,
    "dormitoryId" TEXT,
    "dayOfWeek" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstitutionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubstitutionBatch_dateKey_idx" ON "SubstitutionBatch"("dateKey");

-- CreateIndex
CREATE INDEX "SubstitutionBatch_createdAt_idx" ON "SubstitutionBatch"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduleSubstitution_batchId_idx" ON "ScheduleSubstitution"("batchId");

-- CreateIndex
CREATE INDEX "ScheduleSubstitution_mergeGroupId_idx" ON "ScheduleSubstitution"("mergeGroupId");

-- AddForeignKey
ALTER TABLE "SubstitutionBatch" ADD CONSTRAINT "SubstitutionBatch_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionBatch" ADD CONSTRAINT "SubstitutionBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SubstitutionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
