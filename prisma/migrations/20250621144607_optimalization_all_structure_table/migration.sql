/*
  Warnings:

  - You are about to drop the `ArchiveEmis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dormitory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeTeacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentGradeHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeacherSubject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Fan" DROP CONSTRAINT "Fan_dormitoryId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_dormitoryId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_fanId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_homeroomTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "GradeTeacher" DROP CONSTRAINT "GradeTeacher_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "GradeTeacher" DROP CONSTRAINT "GradeTeacher_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_archiveEmisId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGradeHistory" DROP CONSTRAINT "StudentGradeHistory_dormitoryId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGradeHistory" DROP CONSTRAINT "StudentGradeHistory_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGradeHistory" DROP CONSTRAINT "StudentGradeHistory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_teacherId_fkey";

-- DropTable
DROP TABLE "ArchiveEmis";

-- DropTable
DROP TABLE "Attendance";

-- DropTable
DROP TABLE "Dormitory";

-- DropTable
DROP TABLE "Fan";

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "GradeTeacher";

-- DropTable
DROP TABLE "Schedule";

-- DropTable
DROP TABLE "Student";

-- DropTable
DROP TABLE "StudentGradeHistory";

-- DropTable
DROP TABLE "Subject";

-- DropTable
DROP TABLE "Teacher";

-- DropTable
DROP TABLE "TeacherSubject";

-- CreateTable
CREATE TABLE "student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nis" TEXT,
    "archive_emis_id" TEXT,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormitory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "dormitory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "dormitory_id" TEXT,
    "homeroom_teacher_id" TEXT,
    "fan_id" TEXT,

    CONSTRAINT "grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subject" (
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "teacher_subject_pkey" PRIMARY KEY ("teacher_id","subject_id")
);

-- CreateTable
CREATE TABLE "grade_teacher" (
    "teacher_id" TEXT NOT NULL,
    "grade_id" TEXT NOT NULL,

    CONSTRAINT "grade_teacher_pkey" PRIMARY KEY ("teacher_id","grade_id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time_start" TEXT NOT NULL,
    "time_end" TEXT NOT NULL,
    "jam_ke" INTEGER NOT NULL,
    "grade_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "dormitory_id" TEXT,

    CONSTRAINT "fan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_grade_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "dormitoryId" TEXT,

    CONSTRAINT "student_grade_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fan_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fan_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "student_fan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_dormitory_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "dormitory_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),

    CONSTRAINT "student_dormitory_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutation_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_grade_id" TEXT,
    "to_grade_id" TEXT,
    "from_fan_id" TEXT,
    "to_fan_id" TEXT,
    "from_dormitory_id" TEXT,
    "to_dormitory_id" TEXT,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_subject" (
    "id" TEXT NOT NULL,
    "fan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "fan_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_subject_assessment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fan_subject_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_subject_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_progress_target" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fan_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target_end" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "fan_progress_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_emis" (
    "id" TEXT NOT NULL,
    "kk_url" TEXT NOT NULL,
    "ijazah_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archive_emis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_homeroom_teacher_id_key" ON "grade"("homeroom_teacher_id");

-- CreateIndex
CREATE INDEX "grade_dormitory_id_idx" ON "grade"("dormitory_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_name_key" ON "subject"("name");

-- CreateIndex
CREATE INDEX "schedule_grade_id_subject_id_teacher_id_day_of_week_idx" ON "schedule"("grade_id", "subject_id", "teacher_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "fan_name_key" ON "fan"("name");

-- CreateIndex
CREATE INDEX "fan_dormitory_id_idx" ON "fan"("dormitory_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_date_schedule_id_idx" ON "attendance"("student_id", "date", "schedule_id");

-- CreateIndex
CREATE INDEX "student_grade_history_student_id_grade_id_end_date_idx" ON "student_grade_history"("student_id", "grade_id", "end_date");

-- CreateIndex
CREATE INDEX "student_fan_history_student_id_fan_id_end_date_idx" ON "student_fan_history"("student_id", "fan_id", "end_date");

-- CreateIndex
CREATE INDEX "student_dormitory_history_student_id_dormitory_id_start_dat_idx" ON "student_dormitory_history"("student_id", "dormitory_id", "start_date");

-- CreateIndex
CREATE INDEX "mutation_history_student_id_date_idx" ON "mutation_history"("student_id", "date");

-- CreateIndex
CREATE INDEX "fan_subject_fan_id_order_idx" ON "fan_subject"("fan_id", "order");

-- CreateIndex
CREATE INDEX "fan_subject_assessment_student_id_fan_subject_id_idx" ON "fan_subject_assessment"("student_id", "fan_subject_id");

-- CreateIndex
CREATE INDEX "fan_progress_target_student_id_fan_id_idx" ON "fan_progress_target"("student_id", "fan_id");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_archive_emis_id_fkey" FOREIGN KEY ("archive_emis_id") REFERENCES "archive_emis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade" ADD CONSTRAINT "grade_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade" ADD CONSTRAINT "grade_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade" ADD CONSTRAINT "grade_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_teacher" ADD CONSTRAINT "grade_teacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_teacher" ADD CONSTRAINT "grade_teacher_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan" ADD CONSTRAINT "fan_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_history" ADD CONSTRAINT "student_grade_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_history" ADD CONSTRAINT "student_grade_history_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grade_history" ADD CONSTRAINT "student_grade_history_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fan_history" ADD CONSTRAINT "student_fan_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fan_history" ADD CONSTRAINT "student_fan_history_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_dormitory_history" ADD CONSTRAINT "student_dormitory_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_dormitory_history" ADD CONSTRAINT "student_dormitory_history_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_from_grade_id_fkey" FOREIGN KEY ("from_grade_id") REFERENCES "grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_to_grade_id_fkey" FOREIGN KEY ("to_grade_id") REFERENCES "grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_from_fan_id_fkey" FOREIGN KEY ("from_fan_id") REFERENCES "fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_to_fan_id_fkey" FOREIGN KEY ("to_fan_id") REFERENCES "fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_from_dormitory_id_fkey" FOREIGN KEY ("from_dormitory_id") REFERENCES "dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_to_dormitory_id_fkey" FOREIGN KEY ("to_dormitory_id") REFERENCES "dormitory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_subject" ADD CONSTRAINT "fan_subject_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_subject_assessment" ADD CONSTRAINT "fan_subject_assessment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_subject_assessment" ADD CONSTRAINT "fan_subject_assessment_fan_subject_id_fkey" FOREIGN KEY ("fan_subject_id") REFERENCES "fan_subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_progress_target" ADD CONSTRAINT "fan_progress_target_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_progress_target" ADD CONSTRAINT "fan_progress_target_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "fan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
