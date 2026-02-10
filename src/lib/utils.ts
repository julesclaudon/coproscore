import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Copropriété name formatting ---

const ACRONYMS = new Set(["SDC", "SCI", "ASL", "AFUL"]);

const ABBREVIATIONS: Record<string, string> = {
  AV: "Avenue",
  R: "Rue",
  BD: "Boulevard",
  BVD: "Boulevard",
  PL: "Place",
  ALL: "Allée",
  IMP: "Impasse",
  CHEM: "Chemin",
};

const LIAISON_WORDS = new Set([
  "de", "du", "des", "le", "la", "les", "au", "aux", "en", "sur", "et",
]);

/**
 * Converts an all-caps copropriété name to readable Title Case.
 * "SDC 42 AV CLAUDE VELLEFAUX" → "SDC 42 Avenue Claude Vellefaux"
 */
export function formatCoproName(name: string): string {
  if (!name) return name;

  // Separate letters glued to digits: "SDC7HALLES" → "SDC7 HALLES" → "SDC 7 HALLES"
  const spaced = name
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2");

  return spaced
    .split(/\s+/)
    .map((word, index) => {
      const upper = word.toUpperCase();

      // Keep acronyms uppercase
      if (ACRONYMS.has(upper)) return upper;

      // Replace abbreviations (standalone only)
      if (ABBREVIATIONS[upper]) return ABBREVIATIONS[upper];

      // Pure numbers — keep as-is
      if (/^\d+$/.test(word)) return word;

      // Handle l'/d' contractions: "L'HOMME" → "l'Homme"
      const apoMatch = upper.match(/^([LD]')(.+)$/);
      if (apoMatch) {
        const rest = apoMatch[2];
        const restTitled = rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase();
        return apoMatch[1].toLowerCase() + restTitled;
      }

      // Title-case the word
      const titled = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

      // Liaison words stay lowercase (except first word)
      if (index > 0 && LIAISON_WORDS.has(titled.toLowerCase())) {
        return titled.toLowerCase();
      }

      return titled;
    })
    .join(" ");
}
