-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "allowOnlineScheduling" BOOLEAN,
ADD COLUMN     "cancellationLimitHours" INTEGER,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "dateFormat" TEXT,
ADD COLUMN     "defaultAppointmentDuration" INTEGER,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "website" TEXT;
