-- CreateEnum
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "payload" TEXT,
    "status" "AutomationExecutionStatus" NOT NULL,
    "error" TEXT,
    "durationMs" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_executions_eventName_idx" ON "automation_executions"("eventName");
CREATE INDEX "automation_executions_ruleName_idx" ON "automation_executions"("ruleName");
CREATE INDEX "automation_executions_status_idx" ON "automation_executions"("status");
CREATE INDEX "automation_executions_executedAt_idx" ON "automation_executions"("executedAt");
