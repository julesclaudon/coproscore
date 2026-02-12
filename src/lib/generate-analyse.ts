import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { formatPeriod } from "@/lib/format";

export const ANALYSE_MODEL = "claude-sonnet-4-20250514";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AnalyseResult {
  points_forts: string[];
  vigilances: string[];
  recommandations: string[];
  resume: string;
}

export interface CachedAnalyse {
  analyse: AnalyseResult;
  generatedAt: Date;
  cached: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(copro: any): string {
  const period = formatPeriod(copro.periodeConstruction) ?? "non renseignée";
  const syndic = copro.typeSyndic ?? "non renseigné";
  const cooperative = copro.syndicatCooperatif === "oui" ? "Oui" : copro.syndicatCooperatif === "non" ? "Non" : "Non renseigné";
  const lots = copro.nbTotalLots ?? "non renseigné";
  const lotsHab = copro.nbLotsHabitation ?? "non renseigné";
  const peril = copro.coproDansPdp != null && copro.coproDansPdp > 0 ? "Oui" : "Non";
  const residenceService = copro.residenceService === "oui" ? "Oui" : "Non";
  const dpe = copro.dpeClasseMediane ?? "non disponible";
  const dpeNb = copro.dpeNbLogements ?? 0;
  const prixM2 = copro.marchePrixM2 != null ? `${Math.round(copro.marchePrixM2)} €/m²` : "non disponible";
  const evolution = copro.marcheEvolution != null ? `${copro.marcheEvolution >= 0 ? "+" : ""}${copro.marcheEvolution.toFixed(1)}%` : "non disponible";
  const nbTransactions = copro.marcheNbTransactions ?? "non disponible";
  const confiance = copro.indiceConfiance != null ? `${Math.round(copro.indiceConfiance)}%` : "non disponible";
  const commune = copro.communeAdresse ?? "inconnue";
  const adresse = copro.adresseReference ?? "inconnue";
  const qp = copro.nomQp2024 ?? null;
  const acv = copro.coproDansAcv === "oui";
  const pvd = copro.coproDansPvd === "oui";

  return `Tu es un expert en immobilier et copropriété en France. Analyse cette copropriété et produis un avis structuré.

DONNÉES DE LA COPROPRIÉTÉ :

Localisation : ${adresse}, ${copro.codePostal} ${commune}
Score global : ${copro.scoreGlobal}/100
- Technique : ${copro.scoreTechnique ?? "N/A"}/25
- Risques : ${copro.scoreRisques ?? "N/A"}/30
- Gouvernance : ${copro.scoreGouvernance ?? "N/A"}/25
- Énergie : ${copro.scoreEnergie ?? "N/A"}/20
- Marché : ${copro.scoreMarche ?? "N/A"}/20
Indice de confiance : ${confiance}

Informations RNIC :
- Type de syndic : ${syndic}
- Syndicat coopératif : ${cooperative}
- Nombre total de lots : ${lots}
- Lots habitation : ${lotsHab}
- Période de construction : ${period}
- Plan de péril : ${peril}
- Résidence service : ${residenceService}
- Date immatriculation : ${copro.dateImmatriculation ? new Date(copro.dateImmatriculation).toLocaleDateString("fr-FR") : "non renseignée"}
${qp ? `- Quartier prioritaire : ${qp}` : ""}
${acv ? "- Située en zone Action Cœur de Ville" : ""}
${pvd ? "- Située en zone Petites Villes de Demain" : ""}

Données DPE :
- Classe DPE médiane : ${dpe}${dpeNb > 0 ? ` (basée sur ${dpeNb} diagnostic${dpeNb > 1 ? "s" : ""})` : ""}

Données marché immobilier (rayon 500m, 3 ans) :
- Prix moyen : ${prixM2}
- Évolution annuelle : ${evolution}
- Nombre de transactions : ${nbTransactions}

CONSIGNES :
- Sois factuel et professionnel, pas marketing
- N'utilise jamais "excellent" ou "mauvais" de façon absolue — préfère "le score suggère", "les données indiquent"
- Croise les données entre elles pour identifier des corrélations (ex: immeuble ancien + pas de DPE = vigilance)
- Les recommandations doivent être concrètes et actionnables pour un acheteur potentiel

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "points_forts": ["point 1", "point 2", ...],
  "vigilances": ["vigilance 1", "vigilance 2", ...],
  "recommandations": ["recommandation 1", "recommandation 2", ...],
  "resume": "Synthèse de 2-3 phrases."
}

Contraintes :
- points_forts : 2 à 4 éléments
- vigilances : 2 à 4 éléments
- recommandations : 2 à 3 éléments
- resume : 2-3 phrases concises`;
}

function validateAnalyse(data: unknown): data is AnalyseResult {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.points_forts) || obj.points_forts.length < 1) return false;
  if (!Array.isArray(obj.vigilances) || obj.vigilances.length < 1) return false;
  if (!Array.isArray(obj.recommandations) || obj.recommandations.length < 1) return false;
  if (typeof obj.resume !== "string" || obj.resume.length < 10) return false;
  return true;
}

/** Get cached analyse if fresh, or null */
export async function getCachedAnalyse(coproId: number): Promise<CachedAnalyse | null> {
  const cached = await prisma.coproAnalyse.findUnique({ where: { coproId } });
  if (!cached) return null;
  const age = Date.now() - new Date(cached.generatedAt).getTime();
  if (age >= CACHE_TTL_MS) return null;
  return {
    analyse: JSON.parse(cached.analyseJson) as AnalyseResult,
    generatedAt: cached.generatedAt,
    cached: true,
  };
}

/** Generate a fresh analyse via Claude and cache it */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateAnalyse(copro: any): Promise<CachedAnalyse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: ANALYSE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildPrompt(copro) }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let analyse: AnalyseResult;
  try {
    analyse = JSON.parse(textBlock.text);
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON response");
    analyse = JSON.parse(match[0]);
  }

  if (!validateAnalyse(analyse)) {
    throw new Error("Invalid analyse structure");
  }

  const now = new Date();
  await prisma.coproAnalyse.upsert({
    where: { coproId: copro.id },
    create: {
      coproId: copro.id,
      analyseJson: JSON.stringify(analyse),
      modelVersion: ANALYSE_MODEL,
    },
    update: {
      analyseJson: JSON.stringify(analyse),
      generatedAt: now,
      modelVersion: ANALYSE_MODEL,
    },
  });

  return { analyse, generatedAt: now, cached: false };
}

/** Get cached analyse or generate a fresh one */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOrGenerateAnalyse(copro: any): Promise<CachedAnalyse> {
  const cached = await getCachedAnalyse(copro.id);
  if (cached) return cached;
  return generateAnalyse(copro);
}
