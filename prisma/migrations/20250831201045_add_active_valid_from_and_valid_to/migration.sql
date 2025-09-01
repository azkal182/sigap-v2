-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "validTo" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Schedule_teacherId_dayOfWeek_scheduleSlotId_validFrom_valid_idx" ON "Schedule"("teacherId", "dayOfWeek", "scheduleSlotId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Schedule_classId_dayOfWeek_scheduleSlotId_validFrom_validTo_idx" ON "Schedule"("classId", "dayOfWeek", "scheduleSlotId", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "Schedule_dayOfWeek_scheduleSlotId_active_validFrom_validTo_idx" ON "Schedule"("dayOfWeek", "scheduleSlotId", "active", "validFrom", "validTo");
