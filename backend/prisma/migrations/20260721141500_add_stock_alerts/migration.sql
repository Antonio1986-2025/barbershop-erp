-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_LOW';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_ZERO';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_NEGATIVE';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_INACTIVE';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_EXPIRING';

-- CreateEnum
CREATE TYPE "StockAlertType" AS ENUM ('LOW_STOCK', 'ZERO_STOCK', 'NEGATIVE_STOCK', 'INACTIVE_PRODUCT', 'EXPIRING_PRODUCT');

-- AlterTable
ALTER TABLE "stocks" ADD COLUMN "minStock" DECIMAL(10,3);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT,
    "productId" TEXT,
    "type" "StockAlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_alerts_companyId_idx" ON "stock_alerts"("companyId");
CREATE INDEX "stock_alerts_unitId_idx" ON "stock_alerts"("unitId");
CREATE INDEX "stock_alerts_productId_idx" ON "stock_alerts"("productId");
CREATE INDEX "stock_alerts_type_idx" ON "stock_alerts"("type");
CREATE INDEX "stock_alerts_resolved_idx" ON "stock_alerts"("resolved");
CREATE INDEX "stock_alerts_createdAt_idx" ON "stock_alerts"("createdAt");

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
