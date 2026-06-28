ALTER TABLE "inventory_items"
ADD COLUMN IF NOT EXISTS "purchasePriceSource" TEXT,
ADD COLUMN IF NOT EXISTS "purchasePriceSourceCheckedAt" TIMESTAMP(3);
