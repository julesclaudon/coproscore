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
  const prixM2 = copro.marchePrixM2 != null ? `${Math.round(copro.marchePrixM2)} \u20AC/m\u00b2` : "non disponible";
  const evolution = copro.marcheEvolution != null ? `${copro.marcheEvolution >= 0 ? "+" : ""}${copro.marcheEvolution.toFixed(1)}%` : "non disponible";
  const nbTransactions = copro.marcheNbTransactions ?? "non disponible";
  const confiance = copro.indiceConfiance != null ? `${Math.round(copro.indiceConfiance)}%` : "non disponible";
  const commune = copro.communeAdresse ?? "inconnue";
  const adresse = copro.adresseReference ?? "inconnue";
  const qp = copro.nomQp2024 ?? null;
  const acv = copro.coproDansAcv === "oui";
  const pvd = copro.coproDansPvd === "oui";

  return `Tu es un expert en immobilier et copropri\u00e9t\u00e9 en France. Analyse cette copropri\u00e9t\u00e9 et produis un avis structur\u00e9.

DONN\u00c9ES DE LA COPROPRI\u00c9T\u00c9 :

Localisation : ${adresse}, ${copro.codePostal} ${commune}
Score global : ${copro.scoreGlobal}/100
- Technique : ${copro.scoreTechnique ?? "N/A"}/25
- Risques : ${copro.scoreRisques ?? "N/A"}/30
- Gouvernance : ${copro.scoreGouvernance ?? "N/A"}/25
- \u00c9nergie : ${copro.scoreEnergie ?? "N/A"}/20
- March\u00e9 : ${copro.scoreMarche ?? "N/A"}/20
Indice de confiance : ${confiance}

Informations RNIC :
- Type de syndic : ${syndic}
- Syndicat coop\u00e9ratif : ${cooperative}
- Nombre total de lots : ${lots}
- Lots habitation : ${lotsHab}
- P\u00e9riode de construction : ${period}
- Plan de p\u00e9ril : ${peril}
- R\u00e9sidence service : ${residenceService}
- Date immatriculation : ${copro.dateImmatriculation ? new Date(copro.dateImmatriculation).toLocaleDateString("fr-FR") : "non renseign\u00e9e"}
${qp ? `- Quartier prioritaire : ${qp}` : ""}
${acv ? "- Situ\u00e9e en zone Action C\u0153ur de Ville" : ""}
${pvd ? "- Situ\u00e9e en zone Petites Villes de Demain" : ""}

Donn\u00e9es DPE :
- Classe DPE m\u00e9diane : ${dpe}${dpeNb > 0 ? ` (bas\u00e9e sur ${dpeNb} diagnostic${dpeNb > 1 ? "s" : ""})` : ""}

Donn\u00e9es march\u00e9 immobilier (rayon 500m, 3 ans) :
- Prix moyen : ${prixM2}
- \u00c9volution annuelle : ${evolution}
- Nombre de transactions : ${nbTransactions}

CONSIGNES :
- Sois factuel et professionnel, pas marketing
- N'utilise jamais "excellent" ou "mauvais" de fa\u00e7on absolue \u2014 pr\u00e9f\u00e8re "le score sugg\u00e8re", "les donn\u00e9es indiquent"
- Croise les donn\u00e9es entre elles pour identifier des corr\u00e9lations (ex: immeuble ancien + pas de DPE = vigilance)
- Les recommandations doivent \u00eatre concr\u00e8tes et actionnables pour un acheteur potentiel

R\u00e9ponds UNIQUEMENT avec un JSON valide (sans markdown, sans backticks) au format suivant :
{
  "points_forts": ["point 1", "point 2", ...],
  "vigilances": ["vigilance 1", "vigilance 2", ...],
  "recommandations": ["recommandation 1", "recommandation 2", ...],
  "resume": "Synth\u00e8se de 2-3 phrases."
}

Contraintes :
- points_forts : 2 \u00e0 4 \u00e9l\u00e9ments
- vigilances : 2 \u00e0 4 \u00e9l\u00e9ments
- recommandations : 2 \u00e0 3 \u00e9l\u00e9ments
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
