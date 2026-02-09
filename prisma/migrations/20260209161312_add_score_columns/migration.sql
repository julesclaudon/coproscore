-- AlterTable
ALTER TABLE "coproprietes" ADD COLUMN     "indice_confiance" DOUBLE PRECISION,
ADD COLUMN     "score_energie" INTEGER,
ADD COLUMN     "score_global" INTEGER,
ADD COLUMN     "score_gouvernance" INTEGER,
ADD COLUMN     "score_risques" INTEGER,
ADD COLUMN     "score_technique" INTEGER;

-- CreateIndex
CREATE INDEX "coproprietes_score_global_idx" ON "coproprietes"("score_global");
