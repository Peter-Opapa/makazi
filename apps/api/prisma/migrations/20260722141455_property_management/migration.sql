-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT_BLOCK', 'BUNGALOWS', 'GATED_COMMUNITY', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "propertyType" "PropertyType" NOT NULL DEFAULT 'APARTMENT_BLOCK';

-- CreateTable
CREATE TABLE "property_photos" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
