-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'SMS', 'VISIT', 'NOTE', 'SYSTEM');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TaskType" AS ENUM ('FOLLOW_UP', 'CALLBACK', 'APPOINTMENT', 'SALE', 'COLLECTION', 'REMINDER', 'OTHER');
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "customer_interactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "appointmentId" TEXT,
    "saleId" TEXT,
    "type" "InteractionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "interactionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "metadata" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_interactions_companyId_idx" ON "customer_interactions"("companyId");
CREATE INDEX "customer_interactions_customerId_idx" ON "customer_interactions"("customerId");
CREATE INDEX "customer_interactions_type_idx" ON "customer_interactions"("type");
CREATE INDEX "customer_interactions_campaignId_idx" ON "customer_interactions"("campaignId");
CREATE INDEX "customer_interactions_interactionAt_idx" ON "customer_interactions"("interactionAt");
CREATE INDEX "customer_tasks_companyId_idx" ON "customer_tasks"("companyId");
CREATE INDEX "customer_tasks_customerId_idx" ON "customer_tasks"("customerId");
CREATE INDEX "customer_tasks_assignedTo_idx" ON "customer_tasks"("assignedTo");
CREATE INDEX "customer_tasks_status_idx" ON "customer_tasks"("status");
CREATE INDEX "customer_tasks_priority_idx" ON "customer_tasks"("priority");
CREATE INDEX "customer_tasks_dueDate_idx" ON "customer_tasks"("dueDate");

-- AddForeignKey
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
