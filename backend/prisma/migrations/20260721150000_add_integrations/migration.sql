-- CreateEnum
CREATE TYPE "IntegrationLogDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "IntegrationLogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT,
    "webhookSecret" TEXT,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "direction" "IntegrationLogDirection" NOT NULL,
    "payload" TEXT,
    "status" "IntegrationLogStatus" NOT NULL,
    "error" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrations_companyId_idx" ON "integrations"("companyId");
CREATE INDEX "integrations_type_idx" ON "integrations"("type");
CREATE INDEX "integrations_active_idx" ON "integrations"("active");
CREATE INDEX "integration_logs_integrationId_idx" ON "integration_logs"("integrationId");
CREATE INDEX "integration_logs_eventName_idx" ON "integration_logs"("eventName");
CREATE INDEX "integration_logs_direction_idx" ON "integration_logs"("direction");
CREATE INDEX "integration_logs_status_idx" ON "integration_logs"("status");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
