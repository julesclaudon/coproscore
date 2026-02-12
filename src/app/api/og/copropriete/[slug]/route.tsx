import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCoproName } from "@/lib/utils";

export const runtime = "nodejs";

function scoreHex(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 70) return "#0d9488";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention";
}

const dimensions: { key: string; label: string; max: number }[] = [
  { key: "scoreTechnique", label: "Technique", max: 25 },
  { key: "scoreRisques", label: "Risques", max: 30 },
  { key: "scoreGouvernance", label: "Gouvernance", max: 25 },
  { key: "scoreEnergie", label: "Énergie", max: 20 },
  { key: "scoreMarche", label: "Marché", max: 20 },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const copro = await prisma.copropriete.findUnique({
    where: { slug },
    select: {
      adresseReference: true,
      codePostal: true,
      communeAdresse: true,
      scoreGlobal: true,
      nbLotsHabitation: true,
      typeSyndic: true,
      scoreTechnique: true,
      scoreRisques: true,
      scoreGouvernance: true,
      scoreEnergie: true,
      scoreMarche: true,
    },
  });

  if (!copro) {
    return new Response("Not found", { status: 404 });
  }

  const displayName = formatCoproName(copro.adresseReference || "Copropriété");
  const ville = [copro.codePostal, copro.communeAdresse].filter(Boolean).join(" ");
  const score = copro.scoreGlobal;
  const color = scoreHex(score);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "24px 48px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
            Copro
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0d9488" }}>
            Score
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            padding: "40px 48px",
            gap: 48,
          }}
        >
          {/* Left: score circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 260,
            }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                border: `8px solid ${color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
              }}
            >
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  color: color,
                  lineHeight: 1,
                }}
              >
                {score ?? "?"}
              </span>
              <span
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  marginTop: 4,
                }}
              >
                /100
              </span>
            </div>
            <span
              style={{
                marginTop: 12,
                fontSize: 20,
                fontWeight: 600,
                color: color,
              }}
            >
              {scoreLabel(score)}
            </span>
          </div>

          {/* Right: info + dimension bars */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.2,
                maxWidth: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </span>
            <span style={{ fontSize: 20, color: "#64748b" }}>
              {ville}
              {copro.nbLotsHabitation
                ? ` • ${copro.nbLotsHabitation} lots`
                : ""}
              {copro.typeSyndic
                ? ` • Syndic ${copro.typeSyndic.toLowerCase()}`
                : ""}
            </span>

            {/* Dimension bars */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 16,
              }}
            >
              {dimensions.map((dim) => {
                const val = (copro as Record<string, unknown>)[dim.key] as number | null;
                const pct = val != null ? Math.round((val / dim.max) * 100) : 0;
                const barColor = scoreHex(val != null ? Math.round((val / dim.max) * 100) : null);
                return (
                  <div
                    key={dim.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 120,
                        fontSize: 16,
                        color: "#475569",
                        textAlign: "right",
                      }}
                    >
                      {dim.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: "#e2e8f0",
                        borderRadius: 10,
                        display: "flex",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: barColor,
                          borderRadius: 10,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 60,
                        fontSize: 16,
                        color: "#475569",
                      }}
                    >
                      {val ?? "-"}/{dim.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 48px",
            borderTop: "1px solid #e2e8f0",
            fontSize: 16,
            color: "#94a3b8",
          }}
        >
          <span>coproscore.fr</span>
          <span>Données publiques RNIC • DVF • ADEME</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
      },
    }
  );
}
