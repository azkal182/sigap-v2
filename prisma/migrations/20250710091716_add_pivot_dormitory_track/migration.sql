-- CreateTable
CREATE TABLE "DormitoryTrack" (
    "dormitoryId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "DormitoryTrack_pkey" PRIMARY KEY ("dormitoryId","trackId")
);

-- AddForeignKey
ALTER TABLE "DormitoryTrack" ADD CONSTRAINT "DormitoryTrack_dormitoryId_fkey" FOREIGN KEY ("dormitoryId") REFERENCES "Dormitory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DormitoryTrack" ADD CONSTRAINT "DormitoryTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
