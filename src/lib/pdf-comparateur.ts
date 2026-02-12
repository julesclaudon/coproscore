import PDFDocument from "pdfkit";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";

interface CoproData {
  nomUsage: string | null;
  adresseReference: string | null;
  communeAdresse: string | null;
  codePostal: string | null;
  nbTotalLots: number | null;
  nbLotsHabitation: number | null;
  periodeConstruction: string | null;
  typeSyndic: string | null;
  syndicatCooperatif: string | null;
  residenceService: string | null;
  coproDansPdp: number | null;
  scoreGlobal: number | null;
  scoreTechnique: number | null;
  scoreRisques: number | null;
  scoreGouvernance: number | null;
  scoreEnergie: number | null;
  scoreMarche: number | null;
  indiceConfiance: number | null;
  dpeClasseMediane: string | null;
  marchePrixM2: number | null;
  marcheEvolution: number | null;
  marcheNbTransactions: number | null;
}

interface RowDef {
  label: string;
  group: string;
  getValue: (c: CoproData) => string;
}

function fmtPrix(n: number | null): string {
  if (n === null) return "—";
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

function fmtEvo(n: number | null): string {
  if (n === null) return "—";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + " %";
}

const ROW_DEFS: RowDef[] = [
  { label: "Nom", group: "Identité", getValue: (c) => formatCoproName(c.nomUsage || c.adresseReference || "—") },
  { label: "Adresse", group: "Identité", getValue: (c) => c.adresseReference || "—" },
  { label: "Commune", group: "Identité", getValue: (c) => [c.codePostal, c.communeAdresse].filter(Boolean).join(" ") || "—" },
  { label: "Lots habitation", group: "Identité", getValue: (c) => c.nbLotsHabitation != null ? String(c.nbLotsHabitation) : "—" },
  { label: "Lots total", group: "Identité", getValue: (c) => c.nbTotalLots != null ? String(c.nbTotalLots) : "—" },
  { label: "Construction", group: "Identité", getValue: (c) => formatPeriod(c.periodeConstruction) || "—" },
  { label: "Score global", group: "Scores", getValue: (c) => c.scoreGlobal != null ? `${c.scoreGlobal}/100` : "—" },
  { label: "Technique", group: "Scores", getValue: (c) => c.scoreTechnique != null ? `${c.scoreTechnique}/25` : "—" },
  { label: "Risques", group: "Scores", getValue: (c) => c.scoreRisques != null ? `${c.scoreRisques}/30` : "—" },
  { label: "Gouvernance", group: "Scores", getValue: (c) => c.scoreGouvernance != null ? `${c.scoreGouvernance}/25` : "—" },
  { label: "Énergie", group: "Scores", getValue: (c) => c.scoreEnergie != null ? `${c.scoreEnergie}/20` : "—" },
  { label: "Marché", group: "Scores", getValue: (c) => c.scoreMarche != null ? `${c.scoreMarche}/20` : "—" },
  { label: "Confiance", group: "Scores", getValue: (c) => c.indiceConfiance != null ? `${Math.round(c.indiceConfiance)}%` : "—" },
  { label: "Type syndic", group: "Gouvernance", getValue: (c) => c.typeSyndic || "—" },
  { label: "Coopératif", group: "Gouvernance", getValue: (c) => c.syndicatCooperatif === "oui" ? "Oui" : c.syndicatCooperatif === "non" ? "Non" : "—" },
  { label: "Plan de péril", group: "Gouvernance", getValue: (c) => c.coproDansPdp != null && c.coproDansPdp > 0 ? "Oui" : "Non" },
  { label: "Classe DPE", group: "Énergie", getValue: (c) => c.dpeClasseMediane || "—" },
  { label: "Prix moyen/m²", group: "Marché", getValue: (c) => c.marchePrixM2 != null ? `${fmtPrix(c.marchePrixM2)}/m²` : "—" },
  { label: "Évolution annuelle", group: "Marché", getValue: (c) => fmtEvo(c.marcheEvolution) },
  { label: "Transactions secteur", group: "Marché", getValue: (c) => c.marcheNbTransactions != null ? String(c.marcheNbTransactions) : "—" },
];

export async function generateComparateurPdf(
  copros: CoproData[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 40 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 80; // margins
    const labelColWidth = 130;
    const coproColWidth = Math.min(
      (pageWidth - labelColWidth) / copros.length,
      200
    );

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Comparatif CoproScore", 40, 40);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        40,
        62
      );

    let y = 90;

    // Table header: copro names
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#0D9488");
    doc.text("Critère", 40, y, { width: labelColWidth });
    copros.forEach((c, i) => {
      const name = formatCoproName(
        c.nomUsage || c.adresseReference || "Copro"
      );
      const x = 40 + labelColWidth + i * coproColWidth;
      doc.text(name.slice(0, 30), x, y, {
        width: coproColWidth - 5,
        align: "center",
      });
    });
    y += 18;

    doc
      .moveTo(40, y)
      .lineTo(40 + labelColWidth + copros.length * coproColWidth, y)
      .strokeColor("#0D9488")
      .lineWidth(1)
      .stroke();
    y += 6;

    // Rows
    let lastGroup = "";
    ROW_DEFS.forEach((row, rowIdx) => {
      // Check page break
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      // Group header
      if (row.group !== lastGroup) {
        lastGroup = row.group;
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#333333")
          .text(row.group.toUpperCase(), 40, y, { width: pageWidth });
        y += 14;
      }

      // Alternating row background
      if (rowIdx % 2 === 0) {
        doc
          .rect(40, y - 2, labelColWidth + copros.length * coproColWidth, 16)
          .fill("#f8fafc");
      }

      // Label
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#555555")
        .text(row.label, 40, y, { width: labelColWidth });

      // Values
      copros.forEach((c, i) => {
        const val = row.getValue(c);
        const isScore = row.group === "Scores";
        doc.font(isScore ? "Helvetica-Bold" : "Helvetica").fillColor(
          isScore ? "#0D9488" : "#333333"
        );
        const x = 40 + labelColWidth + i * coproColWidth;
        doc.text(val.slice(0, 25), x, y, {
          width: coproColWidth - 5,
          align: "center",
        });
      });

      y += 16;
    });

    // Footer disclaimer
    y += 20;
    if (y > doc.page.height - 40) {
      doc.addPage();
      y = 40;
    }
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#999999")
      .text(
        "Données issues du RNIC, DVF, DPE ADEME. Les scores sont calculés à titre indicatif. coproscore.fr",
        40,
        y,
        { width: pageWidth }
      );

    doc.end();
  });
}
