-- CreateIndex
CREATE INDEX "District_name_idx" ON "District"("name");

-- CreateIndex
CREATE INDEX "Province_name_idx" ON "Province"("name");

-- CreateIndex
CREATE INDEX "Regency_name_idx" ON "Regency"("name");

-- CreateIndex
CREATE INDEX "Regency_label_idx" ON "Regency"("label");

-- CreateIndex
CREATE INDEX "Village_name_idx" ON "Village"("name");
