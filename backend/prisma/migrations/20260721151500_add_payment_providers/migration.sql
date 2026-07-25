-- CreateEnum
CREATE TYPE "PaymentProviderType" AS ENUM ('MERCADO_PAGO', 'STRIPE', 'ASAAS');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "externalPaymentId" TEXT;
ALTER TABLE "payments" ADD COLUMN "provider" TEXT;
ALTER TABLE "payments" ADD COLUMN "providerStatus" TEXT;
ALTER TABLE "payments" ADD COLUMN "paymentUrl" TEXT;
ALTER TABLE "payments" ADD COLUMN "pixCode" TEXT;
