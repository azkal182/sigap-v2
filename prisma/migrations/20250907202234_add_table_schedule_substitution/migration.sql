-- CreateTable
CREATE TABLE "ScheduleSubstitution" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduleSlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "substituteId" TEXT NOT NULL,
    "reason" TEXT,
    "createdById" TEXT,
    "slotNumber" INTEGER,
    "slotStartTime" TEXT,
    "slotEndTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleSubstitution_dateKey_idx" ON "ScheduleSubstitution"("dateKey");

-- CreateIndex
CREATE INDEX "ScheduleSubstitution_dateKey_scheduleSlotId_idx" ON "ScheduleSubstitution"("dateKey", "scheduleSlotId");

-- CreateIndex
CREATE INDEX "ScheduleSubstitution_substituteId_dateKey_scheduleSlotId_idx" ON "ScheduleSubstitution"("substituteId", "dateKey", "scheduleSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSubstitution_scheduleId_dateKey_key" ON "ScheduleSubstitution"("scheduleId", "dateKey");

-- AddForeignKey
ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_substituteId_fkey" FOREIGN KEY ("substituteId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSubstitution" ADD CONSTRAINT "ScheduleSubstitution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
