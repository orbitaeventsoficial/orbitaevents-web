-- CreateTable
CREATE TABLE "marketing_spend" (
    "id" TEXT NOT NULL,
    "channel" "LeadSource" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_spend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_spend_year_month_idx" ON "marketing_spend"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_spend_channel_year_month_key" ON "marketing_spend"("channel", "year", "month");
