-- CreateIndex
CREATE INDEX "DormitoryHistory_studentId_endDate_idx" ON "DormitoryHistory"("studentId", "endDate");

-- CreateIndex
CREATE INDEX "History_studentId_status_endDate_idx" ON "History"("studentId", "status", "endDate");
