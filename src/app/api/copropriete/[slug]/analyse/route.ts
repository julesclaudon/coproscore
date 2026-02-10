import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedAnalyse, generateAnalyse, type AnalyseResult } from "@/lib/generate-analyse";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Simple in-memory rate limiter
const rateLimitBucket: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  while (rateLimitBucket.length > 0 && rateLimitBucket[0] < now - RATE_LIMIT_WINDOW_MS) {
    rateLimitBucket.shift();
  }
  if (rateLimitBucket.length >= RATE_LIMIT_MAX) return false;
  rateLimitBucket.push(now);
  return true;
}

interface AnalyseResponse {
  analyse: AnalyseResult;
  generatedAt: string;
  cached: boolean;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const copro = await prisma.copropriete.findUnique({ where: { slug } });
  if (!copro) {
    return NextResponse.json({ error: "Copropri\u00e9t\u00e9 introuvable" }, { status: 404 });
  }

  if (copro.scoreGlobal == null) {
    return NextResponse.json({ error: "Score non disponible" }, { status: 404 });
  }

  // Try cache first (no rate limit for cached results)
  const cached = await getCachedAnalyse(copro.id);
  if (cached) {
    return NextResponse.json({
      analyse: cached.analyse,
      generatedAt: cached.generatedAt.toISOString(),
      cached: true,
    } satisfies AnalyseResponse);
  }

  // Rate limit for new generations
  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: "Trop de requ\u00eates. R\u00e9essayez dans quelques instants." },
      { status: 429 }
    );
  }

  try {
    const result = await generateAnalyse(copro);
    return NextResponse.json({
      analyse: result.analyse,
      generatedAt: result.generatedAt.toISOString(),
      cached: false,
    } satisfies AnalyseResponse);
  } catch (err) {
    console.error("Analyse generation failed:", err);
    return NextResponse.json(
      { error: "\u00c9chec de la g\u00e9n\u00e9ration. R\u00e9essayez plus tard." },
      { status: 500 }
    );
  }
}
