-- AlterTable: campaigns
ALTER TABLE "campaigns" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "campaigns" ADD COLUMN "finishedAt" TIMESTAMP(3);
ALTER TABLE "campaigns" ADD COLUMN "templateVariables" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "metadata" TEXT;

-- AlterTable: campaign_recipients
ALTER TABLE "campaign_recipients" ADD COLUMN "externalMessageId" TEXT;
ALTER TABLE "campaign_recipients" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "campaign_recipients" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
