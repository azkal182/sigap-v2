/*
  Warnings:

  - A unique constraint covering the columns `[name,dormitory_id]` on the table `fan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "fan_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "fan_name_dormitory_id_key" ON "fan"("name", "dormitory_id");
