import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function scoreHex(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 70) return "#0d9488";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function dpeColor(cls: string | null): string {
  const map: Record<string, string> = {
    A: "#059669",
    B: "#22c55e",
    C: "#84cc16",
    D: "#eab308",
    E: "#f97316",
    F: "#ef4444",
    G: "#991b1b",
  };
  return cls ? map[cls] ?? "#94a3b8" : "#94a3b8";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cp = req.nextUrl.searchParams.get("cp") ?? undefined;

  // Parse slug → code commune
  const match = slug.match(/-(\d{5})$/);
  if (!match) return new Response("Invalid slug", { status: 400 });
  const codeCommune = match[1];

  const cpClause = cp ? "AND code_postal = $2" : "";
  const queryParams: string[] = cp ? [codeCommune, cp] : [codeCommune];

  const [info] = await prisma.$queryRawUnsafe<
    {
      nom: string;
      nom_dept: string;
      total: bigint;
      avg_score: number | null;
      avg_prix_m2: number | null;
      dpe_median: string | null;
    }[]
  >(
    `SELECT
       (SELECT INITCAP(nom_officiel_commune)
        FROM coproprietes
        WHERE code_officiel_commune = $1
          AND nom_officiel_commune IS NOT NULL
          AND nom_officiel_commune != 'null'
          AND nom_officiel_commune !~ '^\\d'
        GROUP BY INITCAP(nom_officiel_commune)
        ORDER BY COUNT(*) DESC LIMIT 1) as nom,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score,
       ROUND(AVG(marche_prix_m2)::numeric, 0) as avg_prix_m2,
       (SELECT dpe_classe_mediane FROM coproprietes
        WHERE code_officiel_commune = $1 ${cpClause} AND dpe_classe_mediane IS NOT NULL
        GROUP BY dpe_classe_mediane ORDER BY COUNT(*) DESC LIMIT 1) as dpe_median
     FROM coproprietes
     WHERE code_officiel_commune = $1 ${cpClause}`,
    ...queryParams
  );

  if (!info || !info.nom) {
    return new Response("Not found", { status: 404 });
  }

  const score = info.avg_score;
  const color = scoreHex(score);
  const total = Number(info.total);
  const prix = info.avg_prix_m2 ? Number(info.avg_prix_m2).toLocaleString("fr-FR") : null;
  const dpe = info.dpe_median;

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
        {/* Header */}
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

        {/* Content */}
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
                  fontSize: 56,
                  fontWeight: 800,
                  color: color,
                  lineHeight: 1,
                }}
              >
                {score ?? "?"}
              </span>
              <span style={{ fontSize: 16, color: "#64748b", marginTop: 4 }}>
                /100 moy.
              </span>
            </div>
          </div>

          {/* Right: info + stats */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <span
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              Copropri\u00e9t\u00e9s \u00e0 {info.nom}
            </span>
            <span style={{ fontSize: 22, color: "#64748b" }}>
              {info.nom_dept}
            </span>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
              {/* Total */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "16px 24px",
                  background: "white",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontSize: 36, fontWeight: 700, color: "#0f172a" }}>
                  {total.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontSize: 14, color: "#64748b" }}>
                  copropri\u00e9t\u00e9s
                </span>
              </div>

              {/* Prix */}
              {prix && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 24px",
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#0f172a" }}>
                    {prix} \u20ac
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>
                    prix moyen /m\u00b2
                  </span>
                </div>
              )}

              {/* DPE */}
              {dpe && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 24px",
                    background: "white",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: dpeColor(dpe),
                    }}
                  >
                    DPE {dpe}
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>
                    classe m\u00e9diane
                  </span>
                </div>
              )}
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
          <span>Donn\u00e9es publiques RNIC \u2022 DVF \u2022 ADEME</span>
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
