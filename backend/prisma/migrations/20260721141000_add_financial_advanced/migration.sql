-- CreateEnum
CREATE TYPE "FinancialCategoryType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "FinancialAccountType" AS ENUM ('RECEIVABLE', 'PAYABLE');
CREATE TYPE "FinancialAccountStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialCategoryType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "FinancialAccountType" NOT NULL,
    "status" "FinancialAccountStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_closings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2),
    "expectedAmount" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_companyId_name_type_key" ON "financial_categories"("companyId", "name", "type");
CREATE INDEX "financial_categories_companyId_idx" ON "financial_categories"("companyId");
CREATE INDEX "financial_categories_type_idx" ON "financial_categories"("type");
CREATE INDEX "financial_accounts_companyId_idx" ON "financial_accounts"("companyId");
CREATE INDEX "financial_accounts_status_idx" ON "financial_accounts"("status");
CREATE INDEX "financial_accounts_dueDate_idx" ON "financial_accounts"("dueDate");
CREATE INDEX "financial_accounts_type_idx" ON "financial_accounts"("type");
CREATE INDEX "cash_closings_companyId_idx" ON "cash_closings"("companyId");
CREATE INDEX "cash_closings_unitId_idx" ON "cash_closings"("unitId");
CREATE INDEX "cash_closings_closedAt_idx" ON "cash_closings"("closedAt");

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
