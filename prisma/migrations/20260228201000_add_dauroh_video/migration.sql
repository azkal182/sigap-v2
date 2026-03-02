-- CreateEnum
CREATE TYPE "DaurohVideoType" AS ENUM ('MINGGUAN', 'HIGHLIGHT');

-- CreateTable
CREATE TABLE "DaurohVideo" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "videoType" "DaurohVideoType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DaurohVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DaurohVideo_periodId_idx" ON "DaurohVideo"("periodId");

-- CreateIndex
CREATE INDEX "DaurohVideo_studentId_idx" ON "DaurohVideo"("studentId");

-- CreateIndex
CREATE INDEX "DaurohVideo_periodId_studentId_idx" ON "DaurohVideo"("periodId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "DaurohVideo_studentId_periodId_sequence_videoType_key" ON "DaurohVideo"("studentId", "periodId", "sequence", "videoType");

-- AddForeignKey
ALTER TABLE "DaurohVideo" ADD CONSTRAINT "DaurohVideo_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaurohVideo" ADD CONSTRAINT "DaurohVideo_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
