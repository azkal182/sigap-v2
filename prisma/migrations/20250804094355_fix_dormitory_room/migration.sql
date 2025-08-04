-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "dormitoryRoomId" TEXT;

-- CreateTable
CREATE TABLE "DormitoryRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dormitoryId" TEXT NOT NULL,

    CONSTRAINT "DormitoryRoom_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_dormitoryRoomId_fkey" FOREIGN KEY ("dormitoryRoomId") REFERENCES "DormitoryRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DormitoryRoom" ADD CONSTRAINT "DormitoryRoom_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
