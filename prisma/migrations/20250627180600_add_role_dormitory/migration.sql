-- CreateTable
CREATE TABLE "role_dormitory" (
    "roleId" TEXT NOT NULL,
    "dormitory_id" TEXT NOT NULL,

    CONSTRAINT "role_dormitory_pkey" PRIMARY KEY ("roleId","dormitory_id")
);

-- AddForeignKey
ALTER TABLE "role_dormitory" ADD CONSTRAINT "role_dormitory_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_dormitory" ADD CONSTRAINT "role_dormitory_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
