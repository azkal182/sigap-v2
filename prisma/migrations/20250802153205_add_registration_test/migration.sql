-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TestRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sksId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT,

    CONSTRAINT "TestRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestRegistration_studentId_sksId_status_key" ON "TestRegistration"("studentId", "sksId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Test_registrationId_key" ON "Test"("registrationId");

-- AddForeignKey
ALTER TABLE "TestRegistration" ADD CONSTRAINT "TestRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRegistration" ADD CONSTRAINT "TestRegistration_sksId_fkey" FOREIGN KEY ("sksId") REFERENCES "Sks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRegistration" ADD CONSTRAINT "TestRegistration_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TestRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
