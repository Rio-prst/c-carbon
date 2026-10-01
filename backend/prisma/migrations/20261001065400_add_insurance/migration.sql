-- Create enum for insurance status
CREATE TYPE "insurance_status" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');

-- Create insurance table
CREATE TABLE "insurance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "farm_id" UUID NOT NULL REFERENCES "farms"("id") ON DELETE CASCADE,
  "partner" VARCHAR(255) NOT NULL,
  "status" "insurance_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on farm_id
CREATE INDEX "idx_insurance_farm_id" ON "insurance"("farm_id");
