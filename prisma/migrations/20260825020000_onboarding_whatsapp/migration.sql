-- AlterTable
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "onboardingJson" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappPath" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "goLiveAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "pauseUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "connectionStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED';
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "displayPhone" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "connectedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhoneNumber" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "displayPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "assignedEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PhoneNumber_businessId_idx" ON "PhoneNumber"("businessId");

CREATE TABLE IF NOT EXISTS "FunnelEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FunnelEvent_businessId_name_createdAt_idx" ON "FunnelEvent"("businessId", "name", "createdAt");
