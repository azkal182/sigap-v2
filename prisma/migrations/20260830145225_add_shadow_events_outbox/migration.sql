-- CreateEnum
CREATE TYPE "ShadowEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "shadow_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ShadowEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shadow_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_events_status_created_at_idx" ON "shadow_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "shadow_events_aggregate_type_aggregate_id_idx" ON "shadow_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "shadow_events_event_type_status_idx" ON "shadow_events"("event_type", "status");
