-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_entity" VARCHAR(50) NOT NULL,
    "target_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_farm_id_idx" ON "audit_logs"("farm_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_entity_target_id_idx" ON "audit_logs"("target_entity", "target_id");