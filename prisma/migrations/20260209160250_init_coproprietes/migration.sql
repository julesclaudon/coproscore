-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "coproprietes" (
    "id" SERIAL NOT NULL,
    "numero_immatriculation" TEXT NOT NULL,
    "date_immatriculation" DATE,
    "date_derniere_maj" DATE,
    "type_syndic" TEXT,
    "identification_representant_legal" TEXT,
    "raison_sociale_representant_legal" TEXT,
    "siret_representant_legal" TEXT,
    "code_ape" TEXT,
    "commune_representant_legal" TEXT,
    "mandat_en_cours" TEXT,
    "date_fin_dernier_mandat" DATE,
    "nom_usage" TEXT,
    "adresse_reference" TEXT,
    "numero_voie" TEXT,
    "code_postal" TEXT,
    "commune_adresse" TEXT,
    "adresse_complementaire_1" TEXT,
    "adresse_complementaire_2" TEXT,
    "adresse_complementaire_3" TEXT,
    "nb_adresses_complementaires" INTEGER,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "date_reglement_copropriete" DATE,
    "residence_service" TEXT,
    "syndicat_cooperatif" TEXT,
    "syndicat_type" TEXT,
    "immatriculation_principal" TEXT,
    "nb_asl" INTEGER,
    "nb_aful" INTEGER,
    "nb_unions_syndicats" INTEGER,
    "nb_total_lots" INTEGER,
    "nb_lots_hab_bur_com" INTEGER,
    "nb_lots_habitation" INTEGER,
    "nb_lots_stationnement" INTEGER,
    "periode_construction" TEXT,
    "ref_cadastrale_1" TEXT,
    "code_insee_commune_1" TEXT,
    "prefixe_1" TEXT,
    "section_1" TEXT,
    "numero_parcelle_1" TEXT,
    "ref_cadastrale_2" TEXT,
    "code_insee_commune_2" TEXT,
    "prefixe_2" TEXT,
    "section_2" TEXT,
    "numero_parcelle_2" TEXT,
    "ref_cadastrale_3" TEXT,
    "code_insee_commune_3" TEXT,
    "prefixe_3" TEXT,
    "section_3" TEXT,
    "numero_parcelle_3" TEXT,
    "nb_parcelles_cadastrales" INTEGER,
    "nom_qp_2015" TEXT,
    "code_qp_2015" TEXT,
    "nom_qp_2024" TEXT,
    "code_qp_2024" TEXT,
    "copro_dans_acv" TEXT,
    "copro_dans_pvd" TEXT,
    "code_pdp" TEXT,
    "copro_dans_pdp" INTEGER,
    "copro_aidee" TEXT,
    "code_officiel_commune" TEXT,
    "nom_officiel_commune" TEXT,
    "code_officiel_arrondissement" TEXT,
    "nom_officiel_arrondissement" TEXT,
    "code_officiel_epci" TEXT,
    "nom_officiel_epci" TEXT,
    "code_officiel_departement" TEXT,
    "nom_officiel_departement" TEXT,
    "code_officiel_region" TEXT,
    "nom_officiel_region" TEXT,
    "epci" TEXT,
    "commune" TEXT,

    CONSTRAINT "coproprietes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coproprietes_code_postal_idx" ON "coproprietes"("code_postal");

-- CreateIndex
CREATE INDEX "coproprietes_code_officiel_commune_idx" ON "coproprietes"("code_officiel_commune");

-- CreateIndex
CREATE INDEX "coproprietes_code_officiel_departement_idx" ON "coproprietes"("code_officiel_departement");

-- CreateIndex
CREATE INDEX "coproprietes_periode_construction_idx" ON "coproprietes"("periode_construction");

-- CreateIndex
CREATE INDEX "coproprietes_type_syndic_idx" ON "coproprietes"("type_syndic");

-- CreateIndex
CREATE INDEX "coproprietes_longitude_latitude_idx" ON "coproprietes"("longitude", "latitude");

-- CreateIndex
CREATE UNIQUE INDEX "coproprietes_numero_immatriculation_key" ON "coproprietes"("numero_immatriculation");
