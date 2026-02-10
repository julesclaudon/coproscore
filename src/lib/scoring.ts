export interface CoproprieteInput {
  periodeConstruction: string | null;
  coproDansPdp: number | null;
  typeSyndic: string | null;
  syndicatCooperatif: string | null;
  nbLots: number | null;
  // Risk factors (from RNIC or future data sources)
  administrationProvisoire?: boolean;
  procedureInsalubrite?: boolean;
  procedureEquipements?: boolean;
  arretePerilOrdinaire?: boolean;  // L.511-11
  arretePerilImminent?: boolean;   // L.511-19
  mandatAdHoc?: boolean;
  // Energy
  dpe?: string | null;
  // Technique bonuses (future data sources)
  ascenseur?: boolean;
  nbEtages?: number | null;
  gardienOuEmploye?: boolean;
  // Governance bonus
  cotisationFondsTravaux?: number | null;
  // Energy bonus
  chauffageCollectifConnu?: boolean;
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
  indiceConfiance: number;   // 0-100 (%)
}

// Max raw total = 25 + 30 + 25 + 20 + 20 = 120
const RAW_MAX = 120;

// --- Period helpers ---

const PERIOD_POST_2000 = new Set(["A_COMPTER_DE_2011", "DE_2001_A_2010"]);
const PERIOD_1990_1999 = new Set(["DE_1994_A_2000"]);
const PERIOD_1975_1989 = new Set(["DE_1975_A_1993"]);
const PERIOD_1949_1974 = new Set(["DE_1961_A_1974", "DE_1949_A_1960"]);
const PERIOD_BEFORE_1949 = "AVANT_1949";
const PERIOD_UNKNOWN = new Set(["NON_CONNUE", "non renseigné", "", null, undefined]);

// For energy fallback
const PERIOD_POST_2012 = new Set(["A_COMPTER_DE_2011"]);
const PERIOD_BEFORE_1975 = new Set(["AVANT_1949", "DE_1949_A_1960", "DE_1961_A_1974"]);

function isPeriodKnown(p: string | null): boolean {
  return p !== null && !PERIOD_UNKNOWN.has(p);
}

// --- 1. TECHNIQUE (/25) ---

function scoreTechnique(input: CoproprieteInput): number {
  const p = input.periodeConstruction;

  // Base score from construction period
  let score: number;
  if (!isPeriodKnown(p)) {
    score = 15;
  } else if (PERIOD_POST_2000.has(p!)) {
    score = 25;
  } else if (PERIOD_1990_1999.has(p!)) {
    score = 22;
  } else if (PERIOD_1975_1989.has(p!)) {
    score = 18;
  } else if (PERIOD_1949_1974.has(p!)) {
    score = 13;
  } else if (p === PERIOD_BEFORE_1949) {
    score = 10;
  } else {
    score = 15;
  }

  // Bonus ascenseur: +2 if has elevator AND >3 floors
  if (input.ascenseur && input.nbEtages != null && input.nbEtages > 3) {
    score += 2;
  }

  // Bonus gardien/employé: +3
  if (input.gardienOuEmploye) {
    score += 3;
  }

  return Math.min(score, 25);
}

// --- 2. RISQUES (/30) ---

function scoreRisques(input: CoproprieteInput): number {
  let score = 30;

  // Plan de péril: -15
  if (input.coproDansPdp != null && input.coproDansPdp > 0) {
    score -= 15;
  }

  // Administration provisoire: -20
  if (input.administrationProvisoire) {
    score -= 20;
  }

  // Procédure insalubrité: -12
  if (input.procedureInsalubrite) {
    score -= 12;
  }

  // Procédure équipements communs: -8
  if (input.procedureEquipements) {
    score -= 8;
  }

  // Arrêté L.511-11 (péril ordinaire): -10
  if (input.arretePerilOrdinaire) {
    score -= 10;
  }

  // Arrêté L.511-19 (péril imminent): -18
  if (input.arretePerilImminent) {
    score -= 18;
  }

  // Mandat ad hoc: -5
  if (input.mandatAdHoc) {
    score -= 5;
  }

  return Math.max(0, score);
}

// --- 3. GOUVERNANCE (/25) ---

function scoreGouvernance(input: CoproprieteInput): number {
  const t = input.typeSyndic;

  // Base score from syndic type
  let score: number;
  if (!t) {
    score = 8;
  } else if (t === "professionnel") {
    score = 22;
  } else if (input.syndicatCooperatif === "oui") {
    score = 20;
  } else if (t === "bénévole") {
    score = 15;
  } else {
    score = 8;
  }

  // Bonus: syndic pro + >10 lots → +3
  if (t === "professionnel" && input.nbLots != null && input.nbLots > 10) {
    score += 3;
  }

  // Bonus: cotisation fonds travaux renseignée et > 0 → +2
  if (input.cotisationFondsTravaux != null && input.cotisationFondsTravaux > 0) {
    score += 2;
  }

  return Math.min(score, 25);
}

// --- 4. ÉNERGIE (/20) ---

const DPE_SCORES: Record<string, number> = {
  A: 20, B: 17, C: 14, D: 11, E: 8, F: 4, G: 2,
};

function scoreEnergie(input: CoproprieteInput): number {
  // If DPE available, use it
  if (input.dpe && DPE_SCORES[input.dpe] !== undefined) {
    let score = DPE_SCORES[input.dpe];
    // Bonus chauffage collectif connu: +1
    if (input.chauffageCollectifConnu) {
      score += 1;
    }
    return Math.min(score, 20);
  }

  // Fallback based on construction period
  const p = input.periodeConstruction;
  if (isPeriodKnown(p)) {
    if (PERIOD_POST_2012.has(p!)) {
      return 14; // RT2012 → assume C minimum
    }
    if (PERIOD_BEFORE_1975.has(p!)) {
      return 6; // Statistically poor
    }
    // 1975-2012
    return 10;
  }

  // No DPE, unknown period → neutral
  return 10;
}

// --- 5. MARCHÉ (/20) ---

function scoreMarche(input: CoproprieteInput): number {
  const evo = input.marcheEvolution;
  const nbTx = input.marcheNbTransactions;

  // No DVF data within 500m → neutral 10
  if (evo == null || nbTx == null || nbTx < 3) {
    return 10;
  }

  // Base score from evolution
  let score: number;
  if (evo >= 10) score = 20;
  else if (evo >= 5) score = 17;
  else if (evo >= 0) score = 14;
  else if (evo >= -5) score = 11;
  else if (evo >= -10) score = 8;
  else score = 4;

  // Bonus/malus on top
  if (evo > 5) score += 2;
  else if (evo < -5) score -= 2;

  return Math.max(0, Math.min(20, score));
}

// --- 6. INDICE DE CONFIANCE (weighted %) ---

interface ConfidenceField {
  name: string;
  weight: number;
  present: boolean;
}

function computeConfidence(input: CoproprieteInput): number {
  const fields: ConfidenceField[] = [
    {
      name: "periodeConstruction",
      weight: 2,
      present: isPeriodKnown(input.periodeConstruction),
    },
    {
      name: "typeSyndic",
      weight: 3,
      present: input.typeSyndic != null && input.typeSyndic !== "",
    },
    {
      name: "dpe",
      weight: 3,
      present: input.dpe != null && DPE_SCORES[input.dpe] !== undefined,
    },
    {
      name: "coproDansPdp",
      weight: 2,
      present: input.coproDansPdp != null,
    },
    {
      name: "marcheEvolution",
      weight: 2,
      present: input.marcheEvolution != null
        && input.marcheNbTransactions != null
        && input.marcheNbTransactions >= 3,
    },
    {
      name: "nbLots",
      weight: 1,
      present: input.nbLots != null,
    },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  const filledWeight = fields.reduce((sum, f) => sum + (f.present ? f.weight : 0), 0);

  return Math.round((filledWeight / totalWeight) * 100);
}

// --- Main ---

export function calculateScore(input: CoproprieteInput): ScoreResult {
  const tech = scoreTechnique(input);
  const risq = scoreRisques(input);
  const gouv = scoreGouvernance(input);
  const ener = scoreEnergie(input);
  const marc = scoreMarche(input);

  const rawTotal = tech + risq + gouv + ener + marc;
  const normalized = Math.round((rawTotal / RAW_MAX) * 100);

  return {
    scoreGlobal: normalized,
    scoreTechnique: tech,
    scoreRisques: risq,
    scoreGouvernance: gouv,
    scoreEnergie: ener,
    scoreMarche: marc,
    indiceConfiance: computeConfidence(input),
  };
}
