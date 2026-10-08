-- CreateTable
CREATE TABLE "evidence_assets" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evidence_assets_storage_key_key" ON "evidence_assets"("storage_key");

-- CreateIndex
CREATE INDEX "evidence_assets_evidence_id_idx" ON "evidence_assets"("evidence_id");

-- AddForeignKey
ALTER TABLE "evidence_assets" ADD CONSTRAINT "evidence_assets_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;