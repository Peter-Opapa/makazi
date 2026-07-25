-- CreateTable
CREATE TABLE "payment_channel_templates" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "payBillNumber" TEXT,
    "tillNumber" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_channel_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_channel_templates" ADD CONSTRAINT "payment_channel_templates_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
