-- Add soft-disable fields for teacher lifecycle management.
ALTER TABLE "Teacher"
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Teacher_active_idx" ON "Teacher"("active");
CREATE INDEX "Teacher_deletedAt_idx" ON "Teacher"("deletedAt");
