-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "estateArea" TEXT,
ADD COLUMN     "physicalAddress" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "caretakerInviteClaimedAt" TIMESTAMP(3),
ADD COLUMN     "caretakerInviteToken" TEXT,
ADD COLUMN     "caretakerInviteTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "tenantCodeInvitedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "pending_registrations";

-- CreateIndex
CREATE UNIQUE INDEX "users_caretakerInviteToken_key" ON "users"("caretakerInviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");

