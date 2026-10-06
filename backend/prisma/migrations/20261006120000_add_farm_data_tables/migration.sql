-- CreateEnum
CREATE TYPE "FarmDataStatus" AS ENUM ('SELF_REPORTED', 'REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "farm_seasons" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "season_label" VARCHAR(50),
    "start_date" DATE,
    "end_date" DATE,
    "sequence_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_data" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "farm_season_id" TEXT NOT NULL,
    "yield_kg" DECIMAL(10,2),
    "water_usage" DECIMAL(10,2),
    "fertilizer_usage" DECIMAL(10,2),
    "pesticide_usage" DECIMAL(10,2),
    "waste_management_practice" VARCHAR(100),
    "soil_practice" VARCHAR(100),
    "energy_usage" DECIMAL(10,2),
    "low_carbon_practice" BOOLEAN NOT NULL DEFAULT false,
    "status" "FarmDataStatus" NOT NULL DEFAULT 'SELF_REPORTED',
    "rejection_reason" TEXT,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farm_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "farm_data_id" TEXT NOT NULL,
    "type" VARCHAR(20),
    "url" TEXT,
    "file_name" VARCHAR(255),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "farm_seasons_farm_id_idx" ON "farm_seasons"("farm_id");

-- CreateIndex
CREATE INDEX "farm_data_farm_id_idx" ON "farm_data"("farm_id");

-- CreateIndex
CREATE INDEX "farm_data_farm_season_id_idx" ON "farm_data"("farm_season_id");

-- CreateIndex
CREATE INDEX "evidence_farm_data_id_idx" ON "evidence"("farm_data_id");

-- AddForeignKey
ALTER TABLE "farm_seasons" ADD CONSTRAINT "farm_seasons_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_data" ADD CONSTRAINT "farm_data_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_data" ADD CONSTRAINT "farm_data_farm_season_id_fkey" FOREIGN KEY ("farm_season_id") REFERENCES "farm_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_farm_data_id_fkey" FOREIGN KEY ("farm_data_id") REFERENCES "farm_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;