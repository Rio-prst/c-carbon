-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('REGISTERED', 'DATA_COLLECTION', 'ASSESSED', 'CARBON_CANDIDATE');

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "digital_farm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "land_area_ha" DECIMAL(12,4) NOT NULL,
    "commodity" TEXT NOT NULL,
    "status" "FarmStatus" NOT NULL DEFAULT 'REGISTERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farms_digital_farm_id_key" ON "farms"("digital_farm_id");
CREATE INDEX "farms_user_id_idx" ON "farms"("user_id");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
