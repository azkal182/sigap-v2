/*
  Warnings:

  - Added the required column `villageId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "villageId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Province" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "type" TEXT,
    "code" TEXT NOT NULL,
    "fullCode" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "Regency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullCode" TEXT NOT NULL,
    "regencyId" INTEGER NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Village" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullCode" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Regency_provinceId_idx" ON "Regency"("provinceId");

-- CreateIndex
CREATE INDEX "District_regencyId_idx" ON "District"("regencyId");

-- CreateIndex
CREATE INDEX "Village_districtId_idx" ON "Village"("districtId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regency" ADD CONSTRAINT "Regency_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_regencyId_fkey" FOREIGN KEY ("regencyId") REFERENCES "Regency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Village" ADD CONSTRAINT "Village_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
