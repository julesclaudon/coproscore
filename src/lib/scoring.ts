export interface CoproprieteInput {
  periodeConstruction: string | null;
  coproDansPdp: number | null;
  typeSyndic: string | null;
  syndicatCooperatif: string | null;
  // Fields not yet in RNIC but reserved for future data sources
  administrationProvisoire?: boolean;
  procedureEnCours?: boolean;
  dpe?: string | null;
  // Market data (from DVF)
  marcheEvolution?: number | null; // % annual price change
  marcheNbTransactions?: number | null;
}

export interface ScoreResult {
  scoreGlobal: number;       // /100 (normalized from /120)
  scoreTechnique: number;    // /25
  scoreRisques: number;      // /30
  scoreGouvernance: number;  // /25
  scoreEnergie: number;      // /20
  scoreMarche: number;       // /20
  indiceConfiance: number;
}

// Max raw total = 25 + 30 + 25 + 20 + 20 = 120
const RAW_MAX = 120;

function scoreTechnique(input: CoproprieteInput): { score: number; fieldsUsed: number; fieldsTotal: number } {
  let score = 15;
  let fieldsUsed = 0;
  const fieldsTotal = 1;

  const p = input.periodeConstruction;
  if (p && p !== "NON_CONNUE" && p !== "non renseigné") {
    fieldsUsed++;
    if (p === "A_COMPTER_DE_2011" || p === "DE_2001_A_2010") {
      score = 25;
    } else if (p === "DE_1994_A_2000" || p === "DE_1975_A_1993") {
      score = 20;
    } else if (p === "DE_1961_A_1974" || p === "DE_1949_A_1960") {
      score = 15;
    } else if (p === "AVANT_1949") {
      score = 10;
    }
  }

  return { score, fieldsUsed, fieldsTotal };
}

function scoreRisques(input: CoproprieteInput): { score: number; fieldsUsed: number; fieldsTotal: number } {
  let score = 30;
  let fieldsUsed = 0;
  const fieldsTotal = 3;

  if (input.coproDansPdp !== null && input.coproDansPdp !== undefined) {
    fieldsUsed++;
    if (input.coproDansPdp > 0) score -= 20;
  }

  if (input.administrationProvisoire !== undefined) {
    fieldsUsed++;
    if (input.administrationProvisoire) score -= 15;
  }

  if (input.procedureEnCours !== undefined) {
    fieldsUsed++;
    if (input.procedureEnCours) score -= 10;
  }

  return { score: Math.max(0, score), fieldsUsed, fieldsTotal };
}

function scoreGouvernance(input: CoproprieteInput): { score: number; fieldsUsed: number; fieldsTotal: number } {
  let score = 8;
  let fieldsUsed = 0;
  const fieldsTotal = 1;

  const t = input.typeSyndic;
  if (t) {
    fieldsUsed++;
    if (t === "professionnel") {
      score = 25;
    } else if (input.syndicatCooperatif === "oui") {
      score = 20;
    } else if (t === "bénévole") {
      score = 15;
    } else {
      score = 8;
    }
  }

  return { score, fieldsUsed, fieldsTotal };
}

const DPE_SCORES: Record<string, number> = {
  A: 20, B: 17, C: 14, D: 11, E: 8, F: 5, G: 2,
};

function scoreEnergie(input: CoproprieteInput): { score: number; fieldsUsed: number; fieldsTotal: number } {
  const fieldsTotal = 1;
  if (input.dpe && DPE_SCORES[input.dpe] !== undefined) {
    return { score: DPE_SCORES[input.dpe], fieldsUsed: 1, fieldsTotal };
  }
  return { score: 10, fieldsUsed: 0, fieldsTotal };
}

function scoreMarche(input: CoproprieteInput): { score: number; fieldsUsed: number; fieldsTotal: number } {
  const fieldsTotal = 1;

  const evo = input.marcheEvolution;
  const nbTx = input.marcheNbTransactions;

  // Not enough data → neutral
  if (evo === null || evo === undefined || nbTx === null || nbTx === undefined || nbTx < 3) {
    return { score: 10, fieldsUsed: 0, fieldsTotal };
  }

  // evolution is annualized % change
  // +10% or more → 20, +5% → 17, 0% → 14, -5% → 8, -10% or worse → 2
  let score: number;
  if (evo >= 10) score = 20;
  else if (evo >= 5) score = 17;
  else if (evo >= 0) score = 14;
  else if (evo >= -5) score = 11;
  else if (evo >= -10) score = 8;
  else score = 4;

  return { score, fieldsUsed: 1, fieldsTotal };
}

export function calculateScore(input: CoproprieteInput): ScoreResult {
  const technique = scoreTechnique(input);
  const risques = scoreRisques(input);
  const gouvernance = scoreGouvernance(input);
  const energie = scoreEnergie(input);
  const marche = scoreMarche(input);

  const totalFieldsUsed = technique.fieldsUsed + risques.fieldsUsed + gouvernance.fieldsUsed + energie.fieldsUsed + marche.fieldsUsed;
  const totalFields = technique.fieldsTotal + risques.fieldsTotal + gouvernance.fieldsTotal + energie.fieldsTotal + marche.fieldsTotal;

  const rawTotal = technique.score + risques.score + gouvernance.score + energie.score + marche.score;
  const normalized = Math.round((rawTotal / RAW_MAX) * 100);

  return {
    scoreGlobal: normalized,
    scoreTechnique: technique.score,
    scoreRisques: risques.score,
    scoreGouvernance: gouvernance.score,
    scoreEnergie: energie.score,
    scoreMarche: marche.score,
    indiceConfiance: totalFields > 0 ? Math.round((totalFieldsUsed / totalFields) * 100) / 100 : 0,
  };
}
