-- AlterEnum
ALTER TYPE "PaymentChannel" ADD VALUE 'PAYBILL_DIRECT';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "accountReference" TEXT,
ADD COLUMN     "gatewayRequestId" TEXT,
ADD COLUMN     "gatewayResponse" JSONB,
ADD COLUMN     "payerPhone" TEXT;

-- CreateTable
CREATE TABLE "unmatched_payments" (
    "id" TEXT NOT NULL,
    "businessShortCode" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payerPhone" TEXT NOT NULL,
    "accountReference" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "matchedPropertyId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unmatched_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unmatched_payments_transactionId_key" ON "unmatched_payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gatewayRequestId_key" ON "payments"("gatewayRequestId");

-- AddForeignKey
ALTER TABLE "unmatched_payments" ADD CONSTRAINT "unmatched_payments_matchedPropertyId_fkey" FOREIGN KEY ("matchedPropertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
