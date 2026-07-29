-- Afegeix camp dedicat per a l'enllaç de compra/reposició de l'inventari (#1203).
ALTER TABLE "inventory_items" ADD COLUMN "purchaseUrl" TEXT;
