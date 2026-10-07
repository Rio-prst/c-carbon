-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('CANDIDATE', 'ASSESSMENT', 'AGGREGATING', 'VERIFICATION', 'REGISTRATION', 'ISSUANCE', 'TRADING');

-- CreateTable
CREATE TABLE "carbon_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'CANDIDATE',
    "region" TEXT NOT NULL,
    "commodity_focus" VARCHAR(100) NOT NULL,
    "total_farms" INTEGER NOT NULL DEFAULT 0,
    "total_area_ha" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "carbon_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_farms" (
    "id" TEXT NOT NULL,
    "carbon_project_id" TEXT NOT NULL,
    "farm_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_farms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_farms_carbon_project_id_idx" ON "project_farms"("carbon_project_id");

-- CreateIndex
CREATE INDEX "project_farms_farm_id_idx" ON "project_farms"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_farms_carbon_project_id_farm_id_key" ON "project_farms"("carbon_project_id", "farm_id");

-- AddForeignKey
ALTER TABLE "project_farms" ADD CONSTRAINT "project_farms_carbon_project_id_fkey" FOREIGN KEY ("carbon_project_id") REFERENCES "carbon_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_farms" ADD CONSTRAINT "project_farms_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;