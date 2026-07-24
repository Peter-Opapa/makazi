-- AlterTable
ALTER TABLE "users" ADD COLUMN     "caretakerInvitedById" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_caretakerInvitedById_fkey" FOREIGN KEY ("caretakerInvitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

