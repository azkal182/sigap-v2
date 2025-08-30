-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enableTelegram" BOOLEAN NOT NULL DEFAULT false,
    "telegramChatId" TEXT,
    "enableWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_telegramChatId_key" ON "Recipient"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_whatsappPhone_key" ON "Recipient"("whatsappPhone");
