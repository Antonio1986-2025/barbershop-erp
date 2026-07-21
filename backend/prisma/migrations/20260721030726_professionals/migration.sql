-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "specialty" TEXT,
    "commissionRate" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_units" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professionals_companyId_idx" ON "professionals"("companyId");

-- CreateIndex
CREATE INDEX "professionals_name_idx" ON "professionals"("name");

-- CreateIndex
CREATE INDEX "professionals_active_idx" ON "professionals"("active");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_companyId_document_key" ON "professionals"("companyId", "document");

-- CreateIndex
CREATE INDEX "professional_units_professionalId_idx" ON "professional_units"("professionalId");

-- CreateIndex
CREATE INDEX "professional_units_unitId_idx" ON "professional_units"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_units_professionalId_unitId_key" ON "professional_units"("professionalId", "unitId");

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_units" ADD CONSTRAINT "professional_units_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_units" ADD CONSTRAINT "professional_units_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
