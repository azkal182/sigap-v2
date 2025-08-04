-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "formalCalssId" TEXT;

-- CreateTable
CREATE TABLE "FormalCalss" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FormalCalss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormalCalss_name_key" ON "FormalCalss"("name");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_formalCalssId_fkey" FOREIGN KEY ("formalCalssId") REFERENCES "FormalCalss"("id") ON DELETE SET NULL ON UPDATE CASCADE;
