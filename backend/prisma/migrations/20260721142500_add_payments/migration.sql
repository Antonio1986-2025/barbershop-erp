-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'STORE_CREDIT';
ALTER TYPE "PaymentMethod" ADD VALUE 'GIFT_CARD';
ALTER TYPE "PaymentStatus" ADD VALUE 'AUTHORIZED';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "serviceOrderId" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "saleId" TEXT;
ALTER TABLE "payments" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "gatewayTransactionId" TEXT;
ALTER TABLE "payments" ADD COLUMN "gatewayResponse" TEXT;

-- CreateIndex
CREATE INDEX "payments_saleId_idx" ON "payments"("saleId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
