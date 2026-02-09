-- AlterTable
ALTER TABLE "coproprietes" ADD COLUMN     "dpe_classe_mediane" TEXT,
ADD COLUMN     "dpe_distribution" TEXT,
ADD COLUMN     "dpe_nb_logements" INTEGER;

-- CreateTable
CREATE TABLE "dpe_logements" (
    "id" SERIAL NOT NULL,
    "numero_dpe" TEXT NOT NULL,
    "date_dpe" DATE,
    "classe_dpe" TEXT,
    "classe_ges" TEXT,
    "code_postal" TEXT,
    "code_insee" TEXT,
    "adresse" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "numero_immatriculation_copropriete" TEXT,

    CONSTRAINT "dpe_logements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dpe_logements_longitude_latitude_idx" ON "dpe_logements"("longitude", "latitude");

-- CreateIndex
CREATE INDEX "dpe_logements_code_insee_idx" ON "dpe_logements"("code_insee");

-- CreateIndex
CREATE INDEX "dpe_logements_numero_immatriculation_copropriete_idx" ON "dpe_logements"("numero_immatriculation_copropriete");
