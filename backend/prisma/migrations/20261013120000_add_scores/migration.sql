-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "score_type" VARCHAR(10) NOT NULL,
    "value" DECIMAL(6,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "is_provisional" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_at" TIMESTAMP(3),
    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scores_farm_id_idx" ON "scores"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_farm_id_score_type_key" ON "scores"("farm_id", "score_type");

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;