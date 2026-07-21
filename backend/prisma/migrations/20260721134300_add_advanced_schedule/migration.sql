-- CreateEnum
CREATE TYPE "ScheduleBlockType" AS ENUM ('UNIT', 'PROFESSIONAL');

-- CreateTable
CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "professionalId" TEXT,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "type" "ScheduleBlockType" NOT NULL DEFAULT 'UNIT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_unitId_dayOfWeek_key" ON "business_hours"("unitId", "dayOfWeek");
CREATE INDEX "business_hours_companyId_idx" ON "business_hours"("companyId");
CREATE INDEX "business_hours_unitId_idx" ON "business_hours"("unitId");
CREATE INDEX "business_hours_dayOfWeek_idx" ON "business_hours"("dayOfWeek");
CREATE INDEX "schedule_blocks_companyId_idx" ON "schedule_blocks"("companyId");
CREATE INDEX "schedule_blocks_unitId_idx" ON "schedule_blocks"("unitId");
CREATE INDEX "schedule_blocks_professionalId_idx" ON "schedule_blocks"("professionalId");
CREATE INDEX "schedule_blocks_startAt_idx" ON "schedule_blocks"("startAt");

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
