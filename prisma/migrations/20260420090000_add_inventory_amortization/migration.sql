-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN "purchaseDate" TIMESTAMP(3),
ADD COLUMN "purchasePrice" DOUBLE PRECISION,
ADD COLUMN "expectedLifeHours" DOUBLE PRECISION DEFAULT 2000;
