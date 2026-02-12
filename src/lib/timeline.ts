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
  dateLabel?: string; // optional display override (e.g. "Avant 1949")
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
      // Capitalize first letter of the period label for display
      const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
      events.push({
        date: `${year}-01-01`,
        dateLabel: displayLabel,
        sortDate: new Date(year, 0, 1).getTime(),
        type: "construction",
        titre: "Construction de l'immeuble",
        description: `Période : ${label}`,
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
      titre: "Règlement de copropriété",
      description: `Établi le ${formatDateFr(d)}`,
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
      description: `Immatriculée le ${formatDateFr(d)}`,
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
      titre: "DPE réalisé",
      description: `Diagnostic énergétique : ${classeText}`,
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
      titre: "Vente immobilière",
      description: `${surface} m² à ${fmtNum(prixM2)} €/m² (${fmtNum(prix)} €)`,
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
      titre: "Copropriété en plan de péril",
      description: "Inscrite dans un plan de prévention des risques",
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
      description: `Type de gestion constaté au ${formatDateFr(d)}`,
    });
  }

  // 8. Dernière MAJ RNIC
  if (copro.dateDerniereMaj) {
    const d = new Date(copro.dateDerniereMaj);
    events.push({
      date: d.toISOString().slice(0, 10),
      sortDate: d.getTime() + 1, // slightly after syndic event to appear first
      type: "administratif",
      titre: "Mise à jour des données RNIC",
      description: `Dernière mise à jour le ${formatDateFr(d)}`,
    });
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => b.sortDate - a.sortDate);

  return events;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format number with fr-FR locale, replacing U+202F (Helvetica lacks this glyph) */
function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatEventDateDisplay(event: TimelineEvent): string {
  if (event.dateLabel) return event.dateLabel;
  const d = new Date(event.date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
