-- CreateEnum
CREATE TYPE "PositionRole" AS ENUM ('CHAIRMAN', 'MEMBER');

-- CreateTable
CREATE TABLE "Leadership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Leadership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermLeadership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermLeadership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionHistoryLeadership" (
    "id" TEXT NOT NULL,
    "role" "PositionRole" NOT NULL DEFAULT 'MEMBER',
    "notes" TEXT,
    "studentId" TEXT NOT NULL,
    "leadershipId" TEXT NOT NULL,
    "termLeadershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionHistoryLeadership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Leadership_name_key" ON "Leadership"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TermLeadership_name_key" ON "TermLeadership"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PositionHistoryLeadership_leadershipId_termLeadershipId_rol_key" ON "PositionHistoryLeadership"("leadershipId", "termLeadershipId", "role");

-- AddForeignKey
ALTER TABLE "PositionHistoryLeadership" ADD CONSTRAINT "PositionHistoryLeadership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionHistoryLeadership" ADD CONSTRAINT "PositionHistoryLeadership_leadershipId_fkey" FOREIGN KEY ("leadershipId") REFERENCES "Leadership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionHistoryLeadership" ADD CONSTRAINT "PositionHistoryLeadership_termLeadershipId_fkey" FOREIGN KEY ("termLeadershipId") REFERENCES "TermLeadership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
