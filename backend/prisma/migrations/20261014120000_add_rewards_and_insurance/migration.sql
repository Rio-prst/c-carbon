-- CreateTable
CREATE TABLE "reward_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" VARCHAR(40) NOT NULL,
    "points" INTEGER NOT NULL,
    "total_points_snapshot" INTEGER NOT NULL,
    "tier_snapshot" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reward_events_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "insurance" (
    "id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "insurance_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "reward_events_user_id_created_at_idx" ON "reward_events"("user_id", "created_at");
-- CreateIndex
CREATE INDEX "insurance_farm_id_idx" ON "insurance"("farm_id");
-- AddForeignKey
ALTER TABLE "reward_events" ADD CONSTRAINT "reward_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "insurance" ADD CONSTRAINT "insurance_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
