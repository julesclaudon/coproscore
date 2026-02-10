import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCsv } from "@/lib/csv-export";
import { generateComparateurPdf } from "@/lib/pdf-comparateur";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";

const SELECT_FIELDS = {
  id: true,
  slug: true,
  nomUsage: true,
  adresseReference: true,
  communeAdresse: true,
  codePostal: true,
  nbTotalLots: true,
  nbLotsHabitation: true,
  periodeConstruction: true,
  typeSyndic: true,
  syndicatCooperatif: true,
  residenceService: true,
  coproDansPdp: true,
  scoreGlobal: true,
  scoreTechnique: true,
  scoreRisques: true,
  scoreGouvernance: true,
  scoreEnergie: true,
  scoreMarche: true,
  indiceConfiance: true,
  dpeClasseMediane: true,
  dpeNbLogements: true,
  marchePrixM2: true,
  marcheEvolution: true,
  marcheNbTransactions: true,
} as const;

function fmtPrix(n: number | null): string {
  if (n === null) return "\u2014";
  return Math.round(n).toLocaleString("fr-FR") + "\u00a0\u20ac";
}

function fmtEvo(n: number | null): string {
  if (n === null) return "\u2014";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "\u00a0%";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Copro = any;

const ROW_DEFS: { label: string; getValue: (c: Copro) => string }[] = [
  { label: "Nom", getValue: (c) => formatCoproName(c.nomUsage || c.adresseReference || "\u2014") },
  { label: "Adresse", getValue: (c) => c.adresseReference || "\u2014" },
  { label: "Commune", getValue: (c) => [c.codePostal, c.communeAdresse].filter(Boolean).join(" ") || "\u2014" },
  { label: "Lots habitation", getValue: (c) => c.nbLotsHabitation != null ? String(c.nbLotsHabitation) : "\u2014" },
  { label: "Lots total", getValue: (c) => c.nbTotalLots != null ? String(c.nbTotalLots) : "\u2014" },
  { label: "Construction", getValue: (c) => formatPeriod(c.periodeConstruction) || "\u2014" },
  { label: "Score global", getValue: (c) => c.scoreGlobal != null ? `${c.scoreGlobal}/100` : "\u2014" },
  { label: "Technique", getValue: (c) => c.scoreTechnique != null ? `${c.scoreTechnique}/25` : "\u2014" },
  { label: "Risques", getValue: (c) => c.scoreRisques != null ? `${c.scoreRisques}/30` : "\u2014" },
  { label: "Gouvernance", getValue: (c) => c.scoreGouvernance != null ? `${c.scoreGouvernance}/25` : "\u2014" },
  { label: "\u00c9nergie", getValue: (c) => c.scoreEnergie != null ? `${c.scoreEnergie}/20` : "\u2014" },
  { label: "March\u00e9", getValue: (c) => c.scoreMarche != null ? `${c.scoreMarche}/20` : "\u2014" },
  { label: "Confiance", getValue: (c) => c.indiceConfiance != null ? `${Math.round(c.indiceConfiance)}%` : "\u2014" },
  { label: "Type syndic", getValue: (c) => c.typeSyndic || "\u2014" },
  { label: "Coop\u00e9ratif", getValue: (c) => c.syndicatCooperatif === "oui" ? "Oui" : c.syndicatCooperatif === "non" ? "Non" : "\u2014" },
  { label: "Plan de p\u00e9ril", getValue: (c) => c.coproDansPdp != null && c.coproDansPdp > 0 ? "Oui" : "Non" },
  { label: "Classe DPE", getValue: (c) => c.dpeClasseMediane || "\u2014" },
  { label: "Prix moyen/m\u00b2", getValue: (c) => c.marchePrixM2 != null ? `${fmtPrix(c.marchePrixM2)}/m\u00b2` : "\u2014" },
  { label: "\u00c9volution annuelle", getValue: (c) => fmtEvo(c.marcheEvolution) },
  { label: "Transactions secteur", getValue: (c) => c.marcheNbTransactions != null ? String(c.marcheNbTransactions) : "\u2014" },
];

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  if (format !== "csv" && format !== "pdf") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const slugs = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (slugs.length === 0) {
    return NextResponse.json({ error: "No valid ids" }, { status: 400 });
  }

  const copros = await prisma.copropriete.findMany({
    where: { slug: { in: slugs } },
    select: SELECT_FIELDS,
  });

  const bySlug = new Map(copros.map((c) => [c.slug, c]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean) as Copro[];

  if (ordered.length === 0) {
    return NextResponse.json({ error: "No copros found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const headers = [
      "Crit\u00e8re",
      ...ordered.map((c: Copro) =>
        formatCoproName(c.nomUsage || c.adresseReference || "Copro")
      ),
    ];
    const rows = ROW_DEFS.map((r) => [
      r.label,
      ...ordered.map((c: Copro) => r.getValue(c)),
    ]);

    const csv = generateCsv(headers, rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="comparatif-coproscore-${today}.csv"`,
      },
    });
  }

  // PDF
  const pdfBuffer = await generateComparateurPdf(ordered);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="comparatif-coproscore-${today}.pdf"`,
    },
  });
}
