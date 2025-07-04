/*
  Warnings:

  - You are about to drop the `archive_emis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dormitory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fan_progress_target` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fan_subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fan_subject_assessment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grade_teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mutation_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_dormitory_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_fan_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_grade_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_subject` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HistoryStatus" AS ENUM ('STUDYING', 'GRADUATED', 'REPEATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PRESENT', 'SICK', 'PERMIT', 'ABSENT');

-- CreateEnum
CREATE TYPE "DormitoryStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'TRANSFERRED');

-- DropForeignKey
ALTER TABLE "UserDormitory" DROP CONSTRAINT "UserDormitory_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_student_id_fkey";

-- DropForeignKey
ALTER TABLE "fan" DROP CONSTRAINT "fan_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "fan_progress_target" DROP CONSTRAINT "fan_progress_target_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "fan_progress_target" DROP CONSTRAINT "fan_progress_target_student_id_fkey";

-- DropForeignKey
ALTER TABLE "fan_subject" DROP CONSTRAINT "fan_subject_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "fan_subject_assessment" DROP CONSTRAINT "fan_subject_assessment_fan_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "fan_subject_assessment" DROP CONSTRAINT "fan_subject_assessment_student_id_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_homeroom_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "grade_teacher" DROP CONSTRAINT "grade_teacher_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "grade_teacher" DROP CONSTRAINT "grade_teacher_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_from_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_from_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_from_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_student_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_to_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_to_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_to_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "role_dormitory" DROP CONSTRAINT "role_dormitory_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_archive_emis_id_fkey";

-- DropForeignKey
ALTER TABLE "student_dormitory_history" DROP CONSTRAINT "student_dormitory_history_dormitory_id_fkey";

-- DropForeignKey
ALTER TABLE "student_dormitory_history" DROP CONSTRAINT "student_dormitory_history_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_fan_history" DROP CONSTRAINT "student_fan_history_fan_id_fkey";

-- DropForeignKey
ALTER TABLE "student_fan_history" DROP CONSTRAINT "student_fan_history_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_grade_history" DROP CONSTRAINT "student_grade_history_dormitoryId_fkey";

-- DropForeignKey
ALTER TABLE "student_grade_history" DROP CONSTRAINT "student_grade_history_grade_id_fkey";

-- DropForeignKey
ALTER TABLE "student_grade_history" DROP CONSTRAINT "student_grade_history_student_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher_subject" DROP CONSTRAINT "teacher_subject_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher_subject" DROP CONSTRAINT "teacher_subject_teacher_id_fkey";

-- DropTable
DROP TABLE "archive_emis";

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "dormitory";

-- DropTable
DROP TABLE "fan";

-- DropTable
DROP TABLE "fan_progress_target";

-- DropTable
DROP TABLE "fan_subject";

-- DropTable
DROP TABLE "fan_subject_assessment";

-- DropTable
DROP TABLE "grade";

-- DropTable
DROP TABLE "grade_teacher";

-- DropTable
DROP TABLE "mutation_history";

-- DropTable
DROP TABLE "schedule";

-- DropTable
DROP TABLE "student";

-- DropTable
DROP TABLE "student_dormitory_history";

-- DropTable
DROP TABLE "student_fan_history";

-- DropTable
DROP TABLE "student_grade_history";

-- DropTable
DROP TABLE "subject";

-- DropTable
DROP TABLE "teacher";

-- DropTable
DROP TABLE "teacher_subject";

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dormitory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dormitory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DormitoryHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "DormitoryStatus" NOT NULL,
    "dormNameAtThatTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DormitoryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubjectClass" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "HistoryStatus" NOT NULL,
    "score" INTEGER,
    "classNameAtThatTime" TEXT NOT NULL,
    "classTeacherAtThatTime" TEXT NOT NULL,
    "dormNameAtThatTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "scheduleSlotId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AbsenceStatus" NOT NULL,
    "autoFromPermit" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "filledByTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allowedSlots" INTEGER[],
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAbsence" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AbsenceStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAbsence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserDormitory" ADD CONSTRAINT "UserDormitory_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dormitory" ADD CONSTRAINT "role_dormitory_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "Dormitory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DormitoryHistory" ADD CONSTRAINT "DormitoryHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DormitoryHistory" ADD CONSTRAINT "DormitoryHistory_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubjectClass" ADD CONSTRAINT "TeacherSubjectClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubjectClass" ADD CONSTRAINT "TeacherSubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubjectClass" ADD CONSTRAINT "TeacherSubjectClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_filledByTeacherId_fkey" FOREIGN KEY ("filledByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAbsence" ADD CONSTRAINT "TeacherAbsence_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
