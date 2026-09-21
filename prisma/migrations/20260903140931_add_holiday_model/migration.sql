-- CreateEnum
CREATE TYPE "HolidayScope" AS ENUM ('GLOBAL', 'DORMITORY', 'TRACK', 'CLASS');

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "dayOfWeek" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "scope" "HolidayScope" NOT NULL,
    "dormitoryId" TEXT,
    "trackId" TEXT,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Holiday_startDate_endDate_idx" ON "Holiday"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Holiday_dayOfWeek_idx" ON "Holiday"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Holiday_scope_idx" ON "Holiday"("scope");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
