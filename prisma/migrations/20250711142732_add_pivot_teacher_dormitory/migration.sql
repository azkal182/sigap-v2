-- CreateTable
CREATE TABLE "TeacherDormitory" (
    "teacherId" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,

    CONSTRAINT "TeacherDormitory_pkey" PRIMARY KEY ("teacherId","dormitoryId")
);

-- AddForeignKey
ALTER TABLE "TeacherDormitory" ADD CONSTRAINT "TeacherDormitory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherDormitory" ADD CONSTRAINT "TeacherDormitory_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
