-- CreateTable
CREATE TABLE "Sks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackId" TEXT,

    CONSTRAINT "Sks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Sks" ADD CONSTRAINT "Sks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;
