-- CreateEnum
CREATE TYPE "TenancyStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TENANCY_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'TENANCY_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TENANT_EXIT_REQUEST';

-- AlterTable: replace tenancies.active boolean with a status enum, preserving data
ALTER TABLE "tenancies" ADD COLUMN "status" "TenancyStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "tenancies" ADD COLUMN "exitRequestedAt" TIMESTAMP(3);
ALTER TABLE "tenancies" ADD COLUMN "exitReason" TEXT;
UPDATE "tenancies" SET "status" = 'ENDED' WHERE "active" = false;
ALTER TABLE "tenancies" DROP COLUMN "active";
