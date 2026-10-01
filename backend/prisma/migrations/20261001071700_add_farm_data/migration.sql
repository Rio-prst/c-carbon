-- Create farm_seasons table
CREATE TABLE "farm_seasons" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_id" UUID NOT NULL REFERENCES "farms"("id") ON DELETE CASCADE,
  "season_label" VARCHAR(50),
  "start_date" DATE,
  "end_date" DATE,
  "sequence_number" INT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on farm_id
CREATE INDEX "idx_farm_seasons_farm_id" ON "farm_seasons"("farm_id");

-- Create farm_data table
CREATE TABLE "farm_data" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_season_id" UUID NOT NULL REFERENCES "farm_seasons"("id") ON DELETE CASCADE,
  "yield_kg" DECIMAL(10,2),
  "water_usage" DECIMAL(10,2),
  "fertilizer_usage" DECIMAL(10,2),
  "pesticide_usage" DECIMAL(10,2),
  "waste_management_practice" VARCHAR(100),
  "soil_practice" VARCHAR(100),
  "energy_usage" DECIMAL(10,2),
  "low_carbon_practice" BOOLEAN DEFAULT FALSE,
  "status" VARCHAR(20) DEFAULT 'SELF_REPORTED',
  "submitted_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on farm_season_id
CREATE INDEX "idx_farm_data_farm_season_id" ON "farm_data"("farm_season_id");

-- Create evidence table
CREATE TABLE "evidence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_data_id" UUID NOT NULL REFERENCES "farm_data"("id") ON DELETE CASCADE,
  "type" VARCHAR(20),
  "url" TEXT,
  "file_name" VARCHAR(255),
  "uploaded_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on farm_data_id
CREATE INDEX "idx_evidence_farm_data_id" ON "evidence"("farm_data_id");
