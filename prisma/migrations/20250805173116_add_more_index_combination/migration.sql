-- CreateIndex
CREATE INDEX "Absence_absentDate_idx" ON "Absence"("absentDate");

-- CreateIndex
CREATE INDEX "Absence_scheduleId_idx" ON "Absence"("scheduleId");

-- CreateIndex
CREATE INDEX "Class_trackId_idx" ON "Class"("trackId");

-- CreateIndex
CREATE INDEX "Class_dormitoryId_idx" ON "Class"("dormitoryId");

-- CreateIndex
CREATE INDEX "Class_active_idx" ON "Class"("active");

-- CreateIndex
CREATE INDEX "DormitoryHistory_studentId_idx" ON "DormitoryHistory"("studentId");

-- CreateIndex
CREATE INDEX "DormitoryHistory_dormitoryId_idx" ON "DormitoryHistory"("dormitoryId");

-- CreateIndex
CREATE INDEX "History_studentId_idx" ON "History"("studentId");

-- CreateIndex
CREATE INDEX "Permit_studentId_idx" ON "Permit"("studentId");

-- CreateIndex
CREATE INDEX "Permit_startDate_endDate_idx" ON "Permit"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Schedule_classId_dayOfWeek_idx" ON "Schedule"("classId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Schedule_teacherId_dayOfWeek_idx" ON "Schedule"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "Student"("name");

-- CreateIndex
CREATE INDEX "Student_dormitoryId_idx" ON "Student"("dormitoryId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_formalClassId_idx" ON "Student"("formalClassId");

-- CreateIndex
CREATE INDEX "Student_dormitoryRoomId_idx" ON "Student"("dormitoryRoomId");

-- CreateIndex
CREATE INDEX "Subject_name_idx" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Subject_trackId_idx" ON "Subject"("trackId");

-- CreateIndex
CREATE INDEX "Teacher_name_idx" ON "Teacher"("name");

-- CreateIndex
CREATE INDEX "TeacherAbsence_teacherId_date_idx" ON "TeacherAbsence"("teacherId", "date");

-- CreateIndex
CREATE INDEX "TestRegistration_studentId_idx" ON "TestRegistration"("studentId");

-- CreateIndex
CREATE INDEX "TestRegistration_sksId_idx" ON "TestRegistration"("sksId");

-- CreateIndex
CREATE INDEX "TestRegistration_status_idx" ON "TestRegistration"("status");

-- CreateIndex
CREATE INDEX "TestRegistration_subjectId_idx" ON "TestRegistration"("subjectId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
