import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_COPROS = 5;

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

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("slugs");
  if (!slugsParam) {
    return NextResponse.json({ error: "Missing slugs parameter" }, { status: 400 });
  }

  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COPROS);

  if (slugs.length === 0) {
    return NextResponse.json({ copros: [] });
  }

  const copros = await prisma.copropriete.findMany({
    where: { slug: { in: slugs } },
    select: SELECT_FIELDS,
  });

  // Return in the order requested
  const bySlug = new Map(copros.map((c) => [c.slug, c]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean);

  return NextResponse.json({ copros: ordered });
}
