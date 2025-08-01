-- DropForeignKey
ALTER TABLE "Absence" DROP CONSTRAINT "Absence_studentId_fkey";

-- DropForeignKey
ALTER TABLE "DormitoryHistory" DROP CONSTRAINT "DormitoryHistory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Permit" DROP CONSTRAINT "Permit_studentId_fkey";

-- AddForeignKey
ALTER TABLE "DormitoryHistory" ADD CONSTRAINT "DormitoryHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
