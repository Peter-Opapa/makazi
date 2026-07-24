-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenantCode" TEXT,
ADD COLUMN     "tenantCodeClaimedAt" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantCode_key" ON "users"("tenantCode");
