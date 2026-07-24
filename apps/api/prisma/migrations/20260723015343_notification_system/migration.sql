-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_ALERT';

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentsSms" BOOLEAN NOT NULL DEFAULT true,
    "paymentsEmail" BOOLEAN NOT NULL DEFAULT true,
    "paymentsWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceSms" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceEmail" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "accountSms" BOOLEAN NOT NULL DEFAULT true,
    "accountEmail" BOOLEAN NOT NULL DEFAULT true,
    "accountWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
