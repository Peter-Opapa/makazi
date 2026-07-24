-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_SUCCEEDED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_FAILED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "tenancies" ADD COLUMN     "leaseDocumentUrl" TEXT;
