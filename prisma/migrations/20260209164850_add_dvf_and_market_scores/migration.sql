-- AlterTable
ALTER TABLE "coproprietes" ADD COLUMN     "marche_evolution" DOUBLE PRECISION,
ADD COLUMN     "marche_nb_transactions" INTEGER,
ADD COLUMN     "marche_prix_m2" DOUBLE PRECISION,
ADD COLUMN     "score_marche" INTEGER;

-- CreateTable
CREATE TABLE "dvf_transactions" (
    "id" SERIAL NOT NULL,
    "id_mutation" TEXT NOT NULL,
    "date_mutation" DATE NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "surface" DOUBLE PRECISION,
    "nb_pieces" INTEGER,
    "code_postal" TEXT,
    "code_commune" TEXT,
    "adresse" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,

    CONSTRAINT "dvf_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dvf_transactions_longitude_latitude_idx" ON "dvf_transactions"("longitude", "latitude");

-- CreateIndex
CREATE INDEX "dvf_transactions_code_commune_idx" ON "dvf_transactions"("code_commune");

-- CreateIndex
CREATE INDEX "dvf_transactions_date_mutation_idx" ON "dvf_transactions"("date_mutation");
