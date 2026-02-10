import PDFDocument from "pdfkit";
import type { AnalyseResult } from "./generate-analyse";
import { formatPeriod } from "./format";
import type { EstimationTravaux } from "./budget-travaux";
import type { TimelineEvent } from "./timeline";

// ─── Constants ───────────────────────────────────────────────────────────────

const TEAL = "#0d9488";
const TEXT = "#1e293b";
const TEXT_SEC = "#64748b";
const TEXT_MUTED = "#94a3b8";
const BG_ALT = "#f8fafc";
const BG_HEADER = "#f1f5f9";
const BORDER = "#e2e8f0";
const GREEN = "#059669";
const AMBER = "#d97706";
const RED = "#dc2626";
const BLUE = "#2563eb";
const WHITE = "#ffffff";
const TEAL_LIGHT = "#f0fdfa";

const PW = 595.28;
const PH = 841.89;
const M = 50;
const CW = PW - 2 * M;
const CT = 65; // content top (after header line)
const CB = PH - 55; // content bottom (before footer)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportInput {
  displayName: string;
  address: string;
  codePostal: string;
  commune: string;
  slug: string;

  scoreGlobal: number;
  scoreTechnique: number | null;
  scoreRisques: number | null;
  scoreGouvernance: number | null;
  scoreEnergie: number | null;
  scoreMarche: number | null;
  indiceConfiance: number | null;

  nbTotalLots: number | null;
  nbLotsHabitation: number | null;
  typeSyndic: string | null;
  periodeConstruction: string | null;
  syndicatCooperatif: string | null;
  dpeClasseMediane: string | null;

  dimensions: {
    label: string;
    score: number | null;
    max: number;
    detailedExplanation: string;
  }[];

  analyse: AnalyseResult | null;
  analyseDate: string | null;

  marchePrixM2: number | null;
  marcheEvolution: number | null;
  marcheNbTransactions: number | null;
  communeAvgPrix: number | null;
  communeLabel: string;

  transactions: {
    date: string;
    adresse: string;
    surface: number;
    prix: number;
    prixM2: number;
  }[];

  nearby: {
    name: string;
    commune: string | null;
    score: number | null;
    nbLots: number | null;
    distance: number;
  }[];

  estimation: EstimationTravaux | null;

  timeline: TimelineEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sc(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 40) return AMBER;
  return RED;
}

function sl(score: number): string {
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention requise";
}

function fmtPrix(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " \u20ac";
}

function fmtEvo(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + " %";
}

function fmtDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page chrome ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any; // PDFKit.PDFDocument

function pageHeader(doc: Doc, num: number) {
  doc.save();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEAL);
  doc.text("CoproScore", M, 20, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(`Page ${num}`, PW - M - 40, 20, { width: 40, align: "right", lineBreak: false });
  doc
    .moveTo(M, 38)
    .lineTo(PW - M, 38)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();
  doc.restore();
}

let _inPageChrome = false;
function pageFooter(doc: Doc) {
  if (_inPageChrome) return;
  _inPageChrome = true;
  doc.save();
  doc
    .moveTo(M, PH - 45)
    .lineTo(PW - M, PH - 45)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(TEXT_MUTED)
    .text("coproscore.fr", 0, PH - 35, { width: PW, align: "center", lineBreak: false });
  doc.restore();
  _inPageChrome = false;
}

function sectionTitle(doc: Doc, text: string, y: number): number {
  doc.font("Helvetica-Bold").fontSize(14).fillColor(TEAL);
  doc.text(text, M, y, { width: CW });
  return y + 24;
}

// ─── Table helper ────────────────────────────────────────────────────────────

interface Column {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
}

function drawTable(
  doc: Doc,
  columns: Column[],
  rows: string[][],
  startY: number
): number {
  const ROW_H = 18;
  const HDR_H = 22;
  const FS = 7.5;
  const PAD = 5;
  let y = startY;

  function header(atY: number): number {
    doc.save();
    doc.rect(M, atY, CW, HDR_H).fill(BG_HEADER);
    doc.font("Helvetica-Bold").fontSize(FS).fillColor(TEXT_MUTED);
    let x = M;
    for (const col of columns) {
      doc.text(col.label, x + PAD, atY + 6, {
        width: col.width - 2 * PAD,
        align: col.align || "left",
        lineBreak: false,
      });
      x += col.width;
    }
    doc.restore();
    return atY + HDR_H;
  }

  y = header(y);

  for (let i = 0; i < rows.length; i++) {
    if (y + ROW_H > CB) {
      doc.addPage();
      y = header(CT);
    }

    if (i % 2 === 1) {
      doc.save();
      doc.rect(M, y, CW, ROW_H).fill(BG_ALT);
      doc.restore();
    }

    doc.font("Helvetica").fontSize(FS).fillColor(TEXT);
    let x = M;
    for (let j = 0; j < columns.length; j++) {
      doc.text(rows[i][j] || "\u2014", x + PAD, y + 5, {
        width: columns[j].width - 2 * PAD,
        align: columns[j].align || "left",
        lineBreak: false,
      });
      x += columns[j].width;
    }

    y += ROW_H;
  }

  return y;
}

// ─── Page 1: Cover ──────────────────────────────────────────────────────────

function renderCover(doc: Doc, data: ReportInput) {
  const cx = PW / 2;

  // Logo
  doc.font("Helvetica-Bold").fontSize(32).fillColor(TEAL);
  doc.text("Copro", 0, 100, { continued: true, width: PW, align: "center" });
  doc.fillColor(TEXT).text("Score", { width: PW, align: "center" });

  // Score circle
  const circleY = 280;
  const r = 58;
  const color = sc(data.scoreGlobal);
  doc.circle(cx, circleY, r).fill(color);

  // Score number
  doc.font("Helvetica-Bold").fontSize(40).fillColor(WHITE);
  const scoreStr = data.scoreGlobal.toString();
  const tw = doc.widthOfString(scoreStr);
  doc.text(scoreStr, cx - tw / 2, circleY - 22, { lineBreak: false });

  // /100
  doc.font("Helvetica").fontSize(13).fillColor(WHITE);
  const sub = "/ 100";
  const sw = doc.widthOfString(sub);
  doc.text(sub, cx - sw / 2, circleY + 16, { lineBreak: false });

  // Label
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(color)
    .text(sl(data.scoreGlobal), 0, circleY + r + 24, {
      width: PW,
      align: "center",
    });

  // Copro name
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(TEXT)
    .text(data.displayName, M, circleY + r + 65, {
      width: CW,
      align: "center",
    });

  // Address
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(TEXT_SEC)
    .text(
      `${data.address}, ${data.codePostal} ${data.commune}`,
      M,
      doc.y + 8,
      { width: CW, align: "center" }
    );

  // Confidence
  if (data.indiceConfiance != null) {
    doc
      .fontSize(10)
      .fillColor(TEXT_MUTED)
      .text(
        `Indice de confiance : ${Math.round(data.indiceConfiance)}%`,
        M,
        doc.y + 16,
        { width: CW, align: "center" }
      );
  }

  // Date
  doc
    .fontSize(10)
    .fillColor(TEXT_MUTED)
    .text(`Rapport g\u00e9n\u00e9r\u00e9 le ${fmtDate()}`, M, 660, {
      width: CW,
      align: "center",
    });

  // Source
  doc
    .fontSize(8)
    .fillColor(TEXT_MUTED)
    .text(
      "coproscore.fr \u2014 Donn\u00e9es issues du RNIC, DVF, DPE ADEME",
      M,
      740,
      { width: CW, align: "center" }
    );
}

// ─── Page 2: Score détaillé ─────────────────────────────────────────────────

function renderScoreDetail(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Score d\u00e9taill\u00e9", CT);

  const dimColors: Record<string, string> = {
    Technique: "#0ea5e9",
    Risques: "#8b5cf6",
    Gouvernance: "#6366f1",
    "\u00c9nergie": "#f59e0b",
    "March\u00e9": TEAL,
  };

  for (const dim of data.dimensions) {
    if (y + 80 > CB) {
      doc.addPage();
      y = CT;
    }

    const pct = dim.score != null ? dim.score / dim.max : 0;
    const color = dim.score != null ? sc(Math.round(pct * 100)) : TEXT_MUTED;
    const dimColor = dimColors[dim.label] || TEAL;

    // Label row
    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT);
    doc.text(dim.label, M, y, { continued: true, width: CW });
    doc.fillColor(color);
    doc.text(
      `   ${dim.score ?? "\u2014"} / ${dim.max}`,
      { width: CW }
    );
    y += 18;

    // Progress bar
    const barW = CW;
    const barH = 6;
    doc.save();
    doc.roundedRect(M, y, barW, barH, 3).fill(BG_HEADER);
    if (dim.score != null) {
      const fillW = Math.max(pct * barW, 6);
      doc.roundedRect(M, y, fillW, barH, 3).fill(dimColor);
    }
    doc.restore();
    y += barH + 8;

    // Detailed explanation
    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
    const textHeight = doc.heightOfString(dim.detailedExplanation, {
      width: CW,
    });
    doc.text(dim.detailedExplanation, M, y, { width: CW });
    y += textHeight + 16;
  }

  // Key data box
  if (y + 60 > CB) {
    doc.addPage();
    y = CT;
  }

  y += 4;
  doc.save();
  doc.roundedRect(M, y, CW, 50, 4).fill(BG_ALT);
  doc
    .roundedRect(M, y, CW, 50, 4)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();

  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED);
  doc.text("Donn\u00e9es cl\u00e9s", M + 12, y + 8, { lineBreak: false });

  doc.font("Helvetica").fontSize(8).fillColor(TEXT);
  const items = [
    data.nbTotalLots != null ? `${data.nbTotalLots} lots` : null,
    data.typeSyndic ? `Syndic ${data.typeSyndic}` : null,
    formatPeriod(data.periodeConstruction)
      ? `Construction ${formatPeriod(data.periodeConstruction)}`
      : null,
    data.dpeClasseMediane ? `DPE ${data.dpeClasseMediane}` : null,
    data.syndicatCooperatif === "oui" ? "Coop\u00e9ratif" : null,
  ]
    .filter(Boolean)
    .join("  \u2022  ");
  doc.text(items, M + 12, y + 24, { width: CW - 24 });

  doc.restore();
}

// ─── Page 3: Analyse IA ─────────────────────────────────────────────────────

function renderAnalyse(doc: Doc, data: ReportInput) {
  if (!data.analyse) return;

  let y = sectionTitle(doc, "Analyse CoproScore", CT);

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(
    "G\u00e9n\u00e9r\u00e9e par intelligence artificielle \u00e0 partir des donn\u00e9es publiques",
    M,
    y,
    { width: CW }
  );
  y += 16;

  // Resume box
  doc.save();
  doc.roundedRect(M, y, CW, 0.1).fill(TEAL_LIGHT); // measure first
  const resumeH = doc.heightOfString(data.analyse.resume, { width: CW - 24 });
  const boxH = resumeH + 20;
  doc.roundedRect(M, y, CW, boxH, 4).fill(TEAL_LIGHT);
  doc.font("Helvetica").fontSize(9).fillColor(TEXT);
  doc.text(data.analyse.resume, M + 12, y + 10, { width: CW - 24 });
  doc.restore();
  y += boxH + 20;

  // Points forts
  y = renderAnalyseSection(
    doc,
    y,
    "Points forts",
    data.analyse.points_forts,
    GREEN
  );

  // Vigilances
  y = renderAnalyseSection(
    doc,
    y,
    "Points de vigilance",
    data.analyse.vigilances,
    AMBER
  );

  // Recommandations
  y = renderAnalyseSection(
    doc,
    y,
    "Recommandations",
    data.analyse.recommandations,
    BLUE
  );

  // Date
  if (data.analyseDate) {
    if (y + 20 > CB) {
      doc.addPage();
      y = CT;
    }
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
    doc.text(`Analyse g\u00e9n\u00e9r\u00e9e le ${data.analyseDate}`, M, y + 8, {
      width: CW,
    });
  }
}

function renderAnalyseSection(
  doc: Doc,
  y: number,
  title: string,
  items: string[],
  color: string
): number {
  if (y + 30 > CB) {
    doc.addPage();
    y = CT;
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
  doc.text(title, M, y, { width: CW });
  y += 16;

  for (const item of items) {
    const itemH = doc.heightOfString(item, { width: CW - 22 });
    if (y + itemH + 8 > CB) {
      doc.addPage();
      y = CT;
    }

    // Bullet
    doc.circle(M + 4, y + 5, 3).fill(color);
    // Text
    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
    doc.text(item, M + 14, y, { width: CW - 22 });
    y += itemH + 6;
  }

  return y + 12;
}

// ─── Page: Estimation des travaux ────────────────────────────────────────────

function renderEstimation(doc: Doc, data: ReportInput) {
  if (!data.estimation || data.estimation.postes.length === 0) return;

  let y = sectionTitle(doc, "Estimation des travaux potentiels", CT);

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(
    "Fourchettes bas\u00e9es sur les moyennes nationales ANAH/ADEME. Ne remplace pas un devis professionnel.",
    M,
    y,
    { width: CW }
  );
  y += 18;

  const est = data.estimation;

  // Table of postes
  const cols: Column[] = [
    { label: "Poste de travaux", width: 185 },
    { label: "Description", width: 160 },
    { label: "Min", width: 75, align: "right" },
    { label: "Max", width: CW - 185 - 160 - 75, align: "right" },
  ];

  const rows = est.postes.map((p) => [
    p.nom,
    p.description,
    fmtPrix(p.min),
    fmtPrix(p.max),
  ]);

  y = drawTable(doc, cols, rows, y);
  y += 12;

  // Total box
  if (y + 50 > CB) {
    doc.addPage();
    y = CT;
  }

  doc.save();
  doc.roundedRect(M, y, CW, 44, 4).fill(BG_ALT);
  doc
    .roundedRect(M, y, CW, 44, 4)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
  doc.text("Total estim\u00e9", M + 12, y + 8, { lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT);
  const totalText = `${fmtPrix(est.totalMin)} \u2014 ${fmtPrix(est.totalMax)}`;
  doc.text(totalText, M + 12, y + 8, {
    width: CW - 24,
    align: "right",
  });

  if (data.nbLotsHabitation && data.nbLotsHabitation > 1) {
    const perLotMin = Math.round(est.totalMin / data.nbLotsHabitation);
    const perLotMax = Math.round(est.totalMax / data.nbLotsHabitation);
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    doc.text(
      `soit ${fmtPrix(perLotMin)} \u2014 ${fmtPrix(perLotMax)} par lot`,
      M + 12,
      y + 26,
      { width: CW - 24, align: "right" }
    );
  }

  // Fiabilité
  const fiabLabel =
    est.fiabilite === "haute"
      ? "Estimation fiable (DPE + p\u00e9riode)"
      : est.fiabilite === "moyenne"
        ? "Estimation approximative (p\u00e9riode seule)"
        : "Donn\u00e9es insuffisantes";
  const fiabColor =
    est.fiabilite === "haute" ? GREEN : est.fiabilite === "moyenne" ? AMBER : RED;

  doc.font("Helvetica").fontSize(8).fillColor(fiabColor);
  doc.text(fiabLabel, M + 12, y + 26, { lineBreak: false });

  doc.restore();
  y += 56;

  // Disclaimer
  if (y + 20 > CB) {
    doc.addPage();
    y = CT;
  }
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Ces estimations sont indicatives et bas\u00e9es sur des moyennes nationales. Elles ne remplacent pas un devis professionnel.",
    M,
    y,
    { width: CW }
  );
}

// ─── Page: Chronologie ──────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  construction: "Construction",
  administratif: "Administratif",
  energie: "\u00c9nergie",
  transaction: "Transaction",
  risque: "Risque",
  gouvernance: "Gouvernance",
};

function renderTimeline(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Chronologie", CT);

  const events = data.timeline;

  // Table header
  const colDate = M;
  const colType = M + 90;
  const colEvent = M + 190;
  const colEventW = CW - 190;

  doc.rect(colDate, y, CW, 20).fill(BG_HEADER);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT);
  doc.text("Date", colDate + 6, y + 6, { width: 80 });
  doc.text("Type", colType + 6, y + 6, { width: 90 });
  doc.text("\u00c9v\u00e9nement", colEvent + 6, y + 6, { width: colEventW - 12 });
  y += 20;

  doc.font("Helvetica").fontSize(8);

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // Calculate height needed
    const descHeight = doc.heightOfString(`${ev.titre} \u2014 ${ev.description}`, {
      width: colEventW - 12,
    });
    const rowH = Math.max(18, descHeight + 8);

    // Page break if needed
    if (y + rowH > CB) {
      doc.addPage();
      y = CT;
    }

    // Zebra striping
    if (i % 2 === 1) {
      doc.rect(colDate, y, CW, rowH).fill(BG_ALT);
    }

    // Date
    const d = new Date(ev.date);
    const dateStr = d.getFullYear() < 1990
      ? `~ ${d.getFullYear()}`
      : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

    doc.fillColor(TEXT_SEC).text(dateStr, colDate + 6, y + 4, { width: 80 });

    // Type
    doc.fillColor(TEXT_SEC).text(EVENT_TYPE_LABELS[ev.type] ?? ev.type, colType + 6, y + 4, { width: 90 });

    // Event
    doc.fillColor(TEXT).text(`${ev.titre} \u2014 ${ev.description}`, colEvent + 6, y + 4, { width: colEventW - 12 });

    y += rowH;
  }

  // Bottom border
  doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(BORDER).lineWidth(0.5).stroke();
}

// ─── Page 4: Marché immobilier ──────────────────────────────────────────────

function renderMarket(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "March\u00e9 immobilier", CT);

  // Summary stats
  if (data.marchePrixM2 != null) {
    doc.font("Helvetica").fontSize(9).fillColor(TEXT);

    const stats = [
      `Prix moyen : ${fmtPrix(data.marchePrixM2)}/m\u00b2`,
      data.marcheEvolution != null
        ? `\u00c9volution annuelle : ${fmtEvo(data.marcheEvolution)}`
        : null,
      data.marcheNbTransactions != null
        ? `Transactions : ${data.marcheNbTransactions}`
        : null,
    ]
      .filter(Boolean)
      .join("   |   ");

    doc.text(stats, M, y, { width: CW });
    y += 18;

    // Commune comparison
    if (data.communeAvgPrix != null) {
      const diff = Math.round(
        ((data.marchePrixM2 - data.communeAvgPrix) / data.communeAvgPrix) * 100
      );
      const compText =
        diff >= 0
          ? `${diff}% au-dessus de la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`
          : `${Math.abs(diff)}% en dessous de la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`;
      doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
      doc.text(compText, M, y, { width: CW });
      y += 16;
    }
  }

  y += 4;

  // Transaction table
  if (data.transactions.length > 0) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
    doc.text(
      `Derni\u00e8res transactions (${data.transactions.length})`,
      M,
      y,
      { width: CW }
    );
    y += 18;

    const cols: Column[] = [
      { label: "Date", width: 65 },
      { label: "Adresse", width: 180 },
      { label: "Surface", width: 60, align: "right" },
      { label: "Prix", width: 90, align: "right" },
      { label: "Prix/m\u00b2", width: CW - 65 - 180 - 60 - 90, align: "right" },
    ];

    const rows = data.transactions.map((t) => [
      t.date,
      t.adresse || "\u2014",
      `${Math.round(t.surface)} m\u00b2`,
      fmtPrix(t.prix),
      `${fmtPrix(t.prixM2)}/m\u00b2`,
    ]);

    y = drawTable(doc, cols, rows, y);
  }

  // Source
  if (y + 20 > CB) {
    doc.addPage();
    y = CT;
  }
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Source : DVF (demandes de valeurs fonci\u00e8res), rayon 500m, 3 derni\u00e8res ann\u00e9es",
    M,
    y + 8,
    { width: CW }
  );
}

// ─── Page 5: Copropriétés à proximité ───────────────────────────────────────

function renderNearby(doc: Doc, data: ReportInput) {
  let y = sectionTitle(
    doc,
    `Copropri\u00e9t\u00e9s \u00e0 proximit\u00e9 (${data.nearby.length})`,
    CT
  );

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
  doc.text("Dans un rayon de 500m, tri\u00e9es par distance", M, y, {
    width: CW,
  });
  y += 16;

  const cols: Column[] = [
    { label: "Nom", width: 155 },
    { label: "Commune", width: 115 },
    { label: "Score", width: 50, align: "center" },
    { label: "Lots", width: 55, align: "right" },
    { label: "Distance", width: CW - 155 - 115 - 50 - 55, align: "right" },
  ];

  const rows = data.nearby.map((n) => [
    n.name,
    n.commune || "\u2014",
    n.score != null ? `${n.score}/100` : "\u2014",
    n.nbLots != null ? String(n.nbLots) : "\u2014",
    `${Math.round(n.distance)} m`,
  ]);

  drawTable(doc, cols, rows, y);
}

// ─── Last page: Mentions ────────────────────────────────────────────────────

function renderDisclaimer(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Mentions l\u00e9gales", CT);

  const lines = [
    "Ce rapport est g\u00e9n\u00e9r\u00e9 automatiquement \u00e0 partir de donn\u00e9es publiques ouvertes.",
    "Il ne constitue pas un diagnostic technique global (DTG) ni un avis professionnel.",
    "",
    "Sources :",
    "\u2022 RNIC \u2014 Registre National d'Immatriculation des Copropri\u00e9t\u00e9s",
    "\u2022 DVF \u2014 Demandes de Valeurs Fonci\u00e8res (data.gouv.fr)",
    "\u2022 DPE ADEME \u2014 Diagnostics de Performance \u00c9nerg\u00e9tique",
    "\u2022 BAN \u2014 Base Adresse Nationale",
    "",
    `\u00a9 CoproScore ${new Date().getFullYear()} \u2014 coproscore.fr`,
    "",
    `Rapport : coproscore.fr/copropriete/${data.slug}`,
  ];

  doc.font("Helvetica").fontSize(9).fillColor(TEXT_SEC);
  for (const line of lines) {
    if (line === "") {
      y += 10;
    } else {
      doc.text(line, M, y, { width: CW });
      y += 14;
    }
  }
}

// ─── Main generator ─────────────────────────────────────────────────────────

export async function generatePdfReport(
  input: ReportInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: M, bottom: M, left: M, right: M },
      info: {
        Title: `Rapport CoproScore \u2014 ${input.displayName}`,
        Author: "CoproScore",
        Creator: "coproscore.fr",
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let pageNum = 0;

    // Auto header/footer on new pages (not cover)
    doc.on("pageAdded", () => {
      pageNum++;
      if (pageNum > 1) {
        pageHeader(doc, pageNum);
      }
      pageFooter(doc);
    });

    // Page 1: Cover
    pageNum = 1;
    pageFooter(doc);
    renderCover(doc, input);

    // Page 2: Score détaillé
    doc.addPage();
    renderScoreDetail(doc, input);

    // Page 3: Analyse IA
    if (input.analyse) {
      doc.addPage();
      renderAnalyse(doc, input);
    }

    // Page: Estimation travaux
    if (input.estimation && input.estimation.postes.length > 0) {
      doc.addPage();
      renderEstimation(doc, input);
    }

    // Page: Chronologie
    if (input.timeline.length > 0) {
      doc.addPage();
      renderTimeline(doc, input);
    }

    // Page 4+: Marché immobilier
    if (input.marchePrixM2 != null || input.transactions.length > 0) {
      doc.addPage();
      renderMarket(doc, input);
    }

    // Page 5+: Copros à proximité
    if (input.nearby.length > 0) {
      doc.addPage();
      renderNearby(doc, input);
    }

    // Last: Disclaimer
    doc.addPage();
    renderDisclaimer(doc, input);

    doc.end();
  });
}
