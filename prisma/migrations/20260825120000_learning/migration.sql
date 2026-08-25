-- Learn from owner takeovers and successful AI turns (shop-scoped).
CREATE TABLE IF NOT EXISTS "LearningExample" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "customerText" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "journeyState" TEXT,
    "nextAction" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningExample_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LearningExample_businessId_createdAt_idx" ON "LearningExample"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "LearningExample_businessId_intent_idx" ON "LearningExample"("businessId", "intent");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LearningExample_businessId_fkey'
  ) THEN
    ALTER TABLE "LearningExample" ADD CONSTRAINT "LearningExample_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
