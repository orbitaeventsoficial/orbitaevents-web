-- DropForeignKey
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_customerId_fkey";

-- AlterTable: customerId becomes nullable so a Proposal can live unassigned
ALTER TABLE "proposals" ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey: relax cascade to SET NULL — deleting a customer no longer wipes their proposals
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
