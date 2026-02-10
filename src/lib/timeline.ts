import { formatPeriod, PERIOD_LABELS } from "./format";
import type { DvfRow } from "./dvf-queries";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | "construction"
  | "administratif"
  | "energie"
  | "transaction"
  | "risque"
  | "gouvernance";

export interface TimelineEvent {
  date: string; // ISO or display string (e.g. "1949-01-01" or "2024-06-15")
  sortDate: number; // timestamp for sorting
  type: TimelineEventType;
  titre: string;
  description: string;
}

// ─── Period → approximate year ──────────────────────────────────────────────

const PERIOD_YEAR: Record<string, number> = {
  AVANT_1949: 1940,
  DE_1949_A_1960: 1955,
  DE_1961_A_1974: 1968,
  DE_1975_A_1993: 1984,
  DE_1994_A_2000: 1997,
  DE_2001_A_2010: 2006,
  A_COMPTER_DE_2011: 2015,
};

// ─── Input types ────────────────────────────────────────────────────────────

export interface CoproForTimeline {
  periodeConstruction: string | null;
  dateImmatriculation: Date | null;
  dateDerniereMaj: Date | null;
  dateReglementCopropriete: Date | null;
  dateFinDernierMandat: Date | null;
  coproDansPdp: number | null;
  typeSyndic: string | null;
}

export interface DpeForTimeline {
  dateDpe: Date | null;
  classeDpe: string | null;
}

// ─── Builder ────────────────────────────────────────────────────────────────

export function buildTimeline(
  copro: CoproForTimeline,
  dvfTransactions: DvfRow[],
  dpeData: DpeForTimeline[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Construction
  if (copro.periodeConstruction && copro.periodeConstruction !== "NON_CONNUE") {
    const label = formatPeriod(copro.periodeConstruction);
    if (label) {
      const year = PERIOD_YEAR[copro.periodeConstruction] ?? 1960;
      events.push({
        date: `${year}-01-01`,
        sortDate: new Date(year, 0, 1).getTime(),
        type: "construction",
        titre: "Construction de l'immeuble",
        description: `P\u00e9riode : ${label}`,
      });
    }
  }

  // 2. Règlement de copropriété
  if (copro.dateReglementCopropriete) {
    const d = new Date(copro.dateReglementCopropriete);
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime(),
      type: "administratif",
      titre: "R\u00e8glement de copropri\u00e9t\u00e9",
      description: `\u00c9tabli le ${formatDateFr(d)}`,
    });
  }

  // 3. Immatriculation RNIC
  if (copro.dateImmatriculation) {
    const d = new Date(copro.dateImmatriculation);
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime(),
      type: "administratif",
      titre: "Immatriculation au registre national",
      description: `Immatricul\u00e9e le ${formatDateFr(d)}`,
    });
  }

  // 4. DPE réalisés
  for (const dpe of dpeData) {
    if (!dpe.dateDpe) continue;
    const d = new Date(dpe.dateDpe);
    const classeText = dpe.classeDpe ? `Classe ${dpe.classeDpe}` : "Classe inconnue";
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime(),
      type: "energie",
      titre: "DPE r\u00e9alis\u00e9",
      description: `Diagnostic \u00e9nerg\u00e9tique : ${classeText}`,
    });
  }

  // 5. DVF transactions (100m radius already filtered by caller, limit 10)
  const recentTransactions = dvfTransactions.slice(0, 10);
  for (const tx of recentTransactions) {
    const d = new Date(tx.date_mutation);
    const surface = Number(tx.surface);
    const prix = Number(tx.prix);
    const prixM2 = Number(tx.prix_m2);
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime(),
      type: "transaction",
      titre: "Vente immobili\u00e8re",
      description: `${surface} m\u00b2 \u00e0 ${prixM2.toLocaleString("fr-FR")} \u20ac/m\u00b2 (${prix.toLocaleString("fr-FR")} \u20ac)`,
    });
  }

  // 6. Plan de péril
  if (copro.coproDansPdp != null && copro.coproDansPdp > 0) {
    const sortDate = copro.dateDerniereMaj
      ? new Date(copro.dateDerniereMaj).getTime() - 1
      : Date.now();
    events.push({
      date: copro.dateDerniereMaj
        ? new Date(copro.dateDerniereMaj).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      sortDate,
      type: "risque",
      titre: "Copropri\u00e9t\u00e9 en plan de p\u00e9ril",
      description: "Inscrite dans un plan de pr\u00e9vention des risques",
    });
  }

  // 7. Type de syndic (current state, dated to last MAJ)
  if (copro.typeSyndic && copro.dateDerniereMaj) {
    const d = new Date(copro.dateDerniereMaj);
    const syndicLabel = copro.typeSyndic.charAt(0).toUpperCase() + copro.typeSyndic.slice(1).toLowerCase();
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime(),
      type: "gouvernance",
      titre: `Syndic ${syndicLabel} en place`,
      description: `Type de gestion constat\u00e9 au ${formatDateFr(d)}`,
    });
  }

  // 8. Dernière MAJ RNIC
  if (copro.dateDerniereMaj) {
    const d = new Date(copro.dateDerniereMaj);
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime() + 1, // slightly after syndic event to appear first
      type: "administratif",
      titre: "Mise \u00e0 jour des donn\u00e9es RNIC",
      description: `Derni\u00e8re mise \u00e0 jour le ${formatDateFr(d)}`,
    });
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => b.sortDate - a.sortDate);

  return events;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatEventDateDisplay(isoDate: string): string {
  const d = new Date(isoDate);
  // For very old dates (construction), show just the year
  if (d.getFullYear() < 1990) {
    return `~ ${d.getFullYear()}`;
  }
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
