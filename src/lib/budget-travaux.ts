// ─── Types ───────────────────────────────────────────────────────────────────

export interface PosteTravaux {
  nom: string;
  description: string;
  min: number;
  max: number;
}

export interface EstimationTravaux {
  postes: PosteTravaux[];
  totalMin: number;
  totalMax: number;
  fiabilite: "haute" | "moyenne" | "faible";
}

export interface CoproInput {
  periodeConstruction: string | null;
  nbLotsHabitation: number | null;
  dpeClasseMediane: string | null;
  coproDansPdp: number | null;
}

// ─── Period helpers ──────────────────────────────────────────────────────────

type PeriodBucket = "avant_1949" | "1949_1960" | "1961_1974" | "1975_1993" | "1994_2000" | "2001_2010" | "apres_2011" | null;

function parsePeriod(p: string | null): PeriodBucket {
  if (!p) return null;
  const u = p.toUpperCase().replace(/\s+/g, "_");
  if (u.includes("AVANT_1949")) return "avant_1949";
  if (u.includes("1949") && u.includes("1960")) return "1949_1960";
  if (u.includes("1961") && u.includes("1974")) return "1961_1974";
  if (u.includes("1975") && u.includes("1993")) return "1975_1993";
  if (u.includes("1994") && u.includes("2000")) return "1994_2000";
  if (u.includes("2001") && u.includes("2010")) return "2001_2010";
  if (u.includes("2011")) return "apres_2011";
  return null;
}

function isBefore(period: PeriodBucket, threshold: PeriodBucket): boolean {
  const order: PeriodBucket[] = [
    "avant_1949", "1949_1960", "1961_1974", "1975_1993",
    "1994_2000", "2001_2010", "apres_2011",
  ];
  if (!period || !threshold) return false;
  return order.indexOf(period) < order.indexOf(threshold);
}

function isBeforeOrEqual(period: PeriodBucket, threshold: PeriodBucket): boolean {
  const order: PeriodBucket[] = [
    "avant_1949", "1949_1960", "1961_1974", "1975_1993",
    "1994_2000", "2001_2010", "apres_2011",
  ];
  if (!period || !threshold) return false;
  return order.indexOf(period) <= order.indexOf(threshold);
}

// ─── DPE helpers ─────────────────────────────────────────────────────────────

type DpeClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

function isDpe(classe: string | null): classe is DpeClass {
  return classe != null && "ABCDEFG".includes(classe.toUpperCase());
}

function dpeRank(classe: DpeClass): number {
  return "ABCDEFG".indexOf(classe.toUpperCase());
}

// ─── Main estimation function ────────────────────────────────────────────────

export function estimerBudgetTravaux(copro: CoproInput): EstimationTravaux {
  const period = parsePeriod(copro.periodeConstruction);
  const lots = copro.nbLotsHabitation ?? 1;
  const dpe = isDpe(copro.dpeClasseMediane) ? copro.dpeClasseMediane.toUpperCase() as DpeClass : null;
  const enPeril = copro.coproDansPdp != null && copro.coproDansPdp > 0;

  const postes: PosteTravaux[] = [];

  // 1. Isolation thermique
  if (dpe && dpeRank(dpe) >= dpeRank("E")) {
    // DPE E, F, G — passoire énergétique
    postes.push({
      nom: "Isolation thermique",
      description: `DPE ${dpe} — Passoire énergétique, isolation prioritaire`,
      min: 8_000 * lots,
      max: 15_000 * lots,
    });
  } else if (period && isBefore(period, "1975_1993")) {
    // Construction avant 1975, pas de DPE ou DPE correct
    if (!dpe || dpeRank(dpe) >= dpeRank("C")) {
      postes.push({
        nom: "Isolation thermique",
        description: "Construction avant 1975, isolation probablement insuffisante",
        min: 8_000 * lots,
        max: 15_000 * lots,
      });
    }
  }
  // DPE C-D sans condition de période
  if (postes.length === 0 || postes[postes.length - 1]?.nom !== "Isolation thermique") {
    if (dpe && dpeRank(dpe) >= dpeRank("C") && dpeRank(dpe) <= dpeRank("D")) {
      postes.push({
        nom: "Isolation thermique",
        description: `DPE ${dpe} — Améliorations énergétiques recommandées`,
        min: 3_000 * lots,
        max: 8_000 * lots,
      });
    }
  }

  // 2. Ravalement de façade
  if (period) {
    if (isBeforeOrEqual(period, "1949_1960")) {
      postes.push({
        nom: "Ravalement de façade",
        description: "Bâtiment ancien, ravalement probablement nécessaire",
        min: 4_000 * lots,
        max: 8_000 * lots,
      });
    } else if (isBeforeOrEqual(period, "1975_1993")) {
      postes.push({
        nom: "Ravalement de façade",
        description: "Construction 1960-1990, ravalement à prévoir",
        min: 2_500 * lots,
        max: 5_000 * lots,
      });
    } else {
      postes.push({
        nom: "Ravalement de façade",
        description: "Construction récente, entretien courant",
        min: 1_000 * lots,
        max: 3_000 * lots,
      });
    }
  }

  // 3. Mise aux normes électricité/plomberie
  if (period) {
    if (isBefore(period, "1961_1974")) {
      postes.push({
        nom: "Mise aux normes électricité/plomberie",
        description: "Installation avant 1970, mise aux normes probable",
        min: 3_000 * lots,
        max: 7_000 * lots,
      });
    } else if (isBeforeOrEqual(period, "1975_1993")) {
      postes.push({
        nom: "Mise aux normes électricité/plomberie",
        description: "Installation 1970-1990, vérification recommandée",
        min: 1_500 * lots,
        max: 4_000 * lots,
      });
    }
  }

  // 4. Remplacement ascenseur
  if (lots >= 15 && period && isBefore(period, "1994_2000")) {
    postes.push({
      nom: "Remplacement ascenseur",
      description: "Copropriété de 15+ lots, ascenseur potentiellement vétuste",
      min: 30_000,
      max: 60_000,
    });
  }

  // 5. Réfection toiture
  if (period) {
    const surfaceToiture = lots * 60; // estimation m²
    if (isBefore(period, "1961_1974")) {
      postes.push({
        nom: "Réfection toiture",
        description: `Construction ancienne, toiture estimée à ${surfaceToiture} m²`,
        min: 150 * surfaceToiture,
        max: 300 * surfaceToiture,
      });
    } else if (isBefore(period, "2001_2010")) {
      postes.push({
        nom: "Réfection toiture",
        description: `Toiture 1970-2000, surface estimée ${surfaceToiture} m²`,
        min: 80 * surfaceToiture,
        max: 150 * surfaceToiture,
      });
    }
  }

  // 6. Mise en conformité sécurité incendie (plan de péril)
  if (enPeril) {
    postes.push({
      nom: "Mise en conformité sécurité incendie",
      description: "Plan de péril — Travaux de sécurité obligatoires",
      min: 5_000 * lots,
      max: 15_000 * lots,
    });
  }

  // Totals
  const totalMin = postes.reduce((sum, p) => sum + p.min, 0);
  const totalMax = postes.reduce((sum, p) => sum + p.max, 0);

  // Fiabilité
  let fiabilite: EstimationTravaux["fiabilite"];
  if (dpe && period) {
    fiabilite = "haute";
  } else if (period) {
    fiabilite = "moyenne";
  } else {
    fiabilite = "faible";
  }

  return { postes, totalMin, totalMax, fiabilite };
}
