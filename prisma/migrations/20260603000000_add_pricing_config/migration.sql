-- CreateTable: PricingConfig (singleton de configuració de pricing intelligence)
CREATE TABLE "pricing_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "targetMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "ourHourlyRateByService" JSONB NOT NULL DEFAULT '{}',
    "depositPctRecommended" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "alertThresholds" JSONB NOT NULL DEFAULT '{}',
    "equipmentAmortization" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_config_pkey" PRIMARY KEY ("id")
);
